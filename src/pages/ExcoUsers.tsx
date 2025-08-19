import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { getExcoUsers } from "@/api/backend";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ExcoUser {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  profile_picture: string | null;
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

  const handleUserClick = (excoUser: ExcoUser) => {
    // Navigate to individual EXCO user dashboard
    navigate(`/exco-user-dashboard/${excoUser.id}`, { 
      state: { 
        excoUser: {
          id: excoUser.id,
          full_name: excoUser.full_name,
          email: excoUser.email,
          phone_number: excoUser.phone_number,
          profile_picture: excoUser.profile_picture,
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
                <Skeleton className="w-48 h-60 rounded-lg mx-auto mb-4" />
                <Skeleton className="h-6 w-32 mx-auto mb-2" />
                <Skeleton className="h-4 w-40 mx-auto mb-2" />
                <Skeleton className="h-4 w-28 mx-auto" />
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
          {t('exco.users.description', 'Click on any EXCO user to view their dashboard')}
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
              className="hover:shadow-lg transition-shadow cursor-pointer hover:scale-105 transform duration-200"
              onClick={() => handleUserClick(user)}
            >
              <CardContent className="p-6 text-center">
                <div className="mb-4">
                  {user.profile_picture ? (
                    <img 
                      src={user.profile_picture} 
                      alt={user.full_name}
                      className="w-48 h-60 mx-auto object-cover rounded-lg shadow-md"
                    />
                  ) : (
                    <div className="w-48 h-60 mx-auto bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-2xl text-gray-500 font-semibold">
                        {getUserInitials(user.full_name)}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 text-center leading-tight">
                    {user.full_name}
                  </h3>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="text-center break-words" title={user.portfolio}>
                      {user.portfolio || t('exco.users.no_portfolio', 'No portfolio')}
                    </p>
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