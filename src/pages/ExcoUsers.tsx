import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { getExcoUsers } from "@/api/backend";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserNotificationBadge } from "@/components/UserNotificationBadge";

interface ExcoUser {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  profile_picture: string | null;
  cropped_profile_picture: string | null;
  portfolio: string;
}

export default function ExcoUsers() {
  const [users, setUsers] = useState<ExcoUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchExcoUsers = async () => {
      try {
        setLoading(true);
        const response = await getExcoUsers();
        
        if (response.success) {
          setUsers(response.users);
        } else {
          setError(response.message || 'Failed to fetch EXCO users');
        }
      } catch (err) {
        setError('Error fetching EXCO users');
        console.error('Error fetching EXCO users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExcoUsers();
  }, []);

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  const handlePortfolioClick = (excoUser: ExcoUser) => {
    // Navigate to individual EXCO user dashboard
    navigate(`/exco-user-dashboard/${excoUser.id}`, { 
      state: { 
        excoUser: {
          id: excoUser.id,
          full_name: excoUser.full_name,
          email: excoUser.email,
          phone_number: excoUser.phone_number,
          profile_picture: excoUser.profile_picture,
          cropped_profile_picture: excoUser.cropped_profile_picture,
          portfolio: excoUser.portfolio
        }
      }
    });
  };

  const handlePusatKhidmatClick = (excoUser: ExcoUser) => {
    // Navigate to Pusat Khidmat page (you can modify this route as needed)
    navigate(`/pusat-khidmat/${excoUser.id}`, { 
      state: { 
        excoUser: {
          id: excoUser.id,
          full_name: excoUser.full_name,
          email: excoUser.email,
          phone_number: excoUser.phone_number,
          profile_picture: excoUser.profile_picture,
          cropped_profile_picture: excoUser.cropped_profile_picture,
          portfolio: excoUser.portfolio
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('exco.users.title', 'EXCO Users Directory')}
          </h1>
          <p className="text-gray-600">
            {t('exco.users.description', 'View all EXCO users and their contact information')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <Skeleton className="w-32 h-32 rounded-full mx-auto mb-4" />
                <Skeleton className="h-6 w-32 mx-auto mb-2" />
                <Skeleton className="h-10 w-24 mx-auto mb-2" />
                <Skeleton className="h-10 w-32 mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            {t('common.error', 'Error')}
          </h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('exco.users.title', 'EXCO Users Directory')}
        </h1>
        <p className="text-gray-600">
          {t('exco.users.description', 'View all EXCO users and their contact information')}
        </p>
        <Badge variant="secondary" className="mt-2">
          {users.length} {t('exco.users.count', 'users')}
        </Badge>
      </div>

      {users.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-gray-500 text-lg">
              {t('exco.users.empty', 'No EXCO users found')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {users.map((user) => (
                         <Card 
               key={user.id} 
               className="relative"
             >
                             {/* Notification Badge - Top Right */}
               <div className="absolute top-3 right-3 z-20">
                 <UserNotificationBadge 
                   excoUserId={user.id} 
                   excoUserName={user.full_name} 
                 />
               </div>
              
              <CardContent className="p-6 text-center">
                <div className="mb-4">
                  {user.cropped_profile_picture ? (
                    <img 
                      src={user.cropped_profile_picture} 
                      alt={user.full_name}
                      className="w-32 h-32 mx-auto object-cover rounded-full shadow-md border-4 border-blue-100"
                    />
                  ) : (
                    <div className="w-32 h-32 mx-auto bg-blue-100 rounded-full flex items-center justify-center border-4 border-blue-200">
                      <span className="text-2xl text-blue-600 font-semibold">
                        {getUserInitials(user.full_name)}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 text-center leading-tight">
                    {user.full_name}
                  </h3>
                  
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => handlePortfolioClick(user)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Portfolio
                    </Button>
                    <Button 
                      onClick={() => handlePusatKhidmatClick(user)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Pusat Khidmat
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 