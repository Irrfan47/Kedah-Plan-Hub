import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Mail, Phone, Building } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ExcoUser {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  profile_picture: string | null;
  cropped_profile_picture: string | null;
  portfolio: string;
}

export default function PusatKhidmat() {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [excoUser, setExcoUser] = useState<ExcoUser | null>(null);

  useEffect(() => {
    if (location.state?.excoUser) {
      setExcoUser(location.state.excoUser);
    }
  }, [location.state]);

  const handleBack = () => {
    navigate('/exco-users');
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  if (!excoUser) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            {t('common.error', 'Error')}
          </h1>
          <p className="text-gray-600">User information not found</p>
          <Button onClick={handleBack} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to EXCO Users
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button 
          onClick={handleBack} 
          variant="outline" 
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to EXCO Users
        </Button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Pusat Khidmat - {excoUser.full_name}
        </h1>
        <p className="text-gray-600">
          View information and services for {excoUser.full_name}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="mb-4">
              {excoUser.profile_picture ? (
                <img 
                  src={excoUser.profile_picture} 
                  alt={excoUser.full_name}
                  className="w-32 h-32 mx-auto object-cover rounded-full shadow-md border-4 border-blue-100"
                />
              ) : (
                <div className="w-32 h-32 mx-auto bg-blue-100 rounded-full flex items-center justify-center border-4 border-blue-200">
                  <span className="text-2xl text-blue-600 font-semibold">
                    {getUserInitials(excoUser.full_name)}
                  </span>
                </div>
              )}
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {excoUser.full_name}
            </h3>
            
            <div className="space-y-3 text-left">
              <div className="flex items-center space-x-3">
                <Building className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600">
                  {excoUser.portfolio || 'No portfolio assigned'}
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600 break-all">
                  {excoUser.email}
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600">
                  {excoUser.phone_number}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pusat Khidmat Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Community Services</h4>
                <p className="text-blue-800 text-sm">
                  Providing assistance and support to the local community through various programs and initiatives.
                </p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2">Development Programs</h4>
                <p className="text-green-800 text-sm">
                  Implementing and managing development projects for the betterment of the community.
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-2">Public Consultation</h4>
                <p className="text-purple-800 text-sm">
                  Engaging with the public to gather feedback and address community concerns.
                </p>
              </div>
              
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-900 mb-2">Resource Management</h4>
                <p className="text-orange-800 text-sm">
                  Efficiently managing resources and budgets for community development projects.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
