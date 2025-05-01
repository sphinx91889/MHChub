import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Stethoscope, Building2, Users, Construction } from 'lucide-react';

export default function MedicalDirectors() {
  const navigate = useNavigate();

  return (
    <>
      <div className="flex justify-between items-center mb-8 pt-5 md:pt-10">
        <div>
          <h2 className="text-2xl font-bold">Medical Directors</h2>
          <p className="text-gray-500 mt-1">Platform and client medical directors</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card 
          className="glass hover:shadow-glass-hover transition-all duration-300 cursor-pointer"
        >
          <CardHeader className="border-l-4 border-l-blue-500">
            <div className="flex items-center gap-3">
              <Stethoscope className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="text-xl font-semibold">Platform Medical Directors</h3>
                <p className="text-sm text-gray-500">Manage platform-wide medical directors</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-4">
              <Construction className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700">Coming Soon</p>
              <p className="text-gray-600 text-center mt-2">
                Platform medical directors management is currently under development.
            </p>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="glass hover:shadow-glass-hover transition-all duration-300 cursor-pointer"
          onClick={() => navigate('/medical-directors/clients')}
        >
          <CardHeader className="border-l-4 border-l-green-500">
            <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="text-xl font-semibold">Client Medical Directors</h3>
                <p className="text-sm text-gray-500">Manage client-specific medical directors</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              View and manage client-specific medical directors, including revenue sharing agreements, licensing information, and client relationships.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}