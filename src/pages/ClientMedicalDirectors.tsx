import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, Phone, Mail, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { fetchApi } from '@/lib/api-config';

interface Client {
  id: number;
  companyName: string;
  medicalDirector?: {
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
    licenseType: string;
    medicalLicenseNumber: string;
    amount: number;
    frequency: string;
    comment: string;
    accountType: string;
    status: string;
  };
}

export default function ClientMedicalDirectors() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [allClients, setAllClients] = useState<Client[]>([]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // First, get all active clients
        const clientsResponse = await fetchApi('/customer');
        const activeClients = clientsResponse.payload.filter((client: any) => client.isActive);

        // Fetch medical director data for each client
        const clientsWithDirectors = await Promise.all(
          activeClients.map(async (client: any) => {
            try {
              const response = await fetchApi(`/customer/${client.id}`);
              return response.payload;
            } catch (err) {
              console.error(`Error fetching medical director for client ${client.id}:`, err);
              return null;
            }
          })
        );

        // Filter out null values and clients without medical directors
        const validClients = clientsWithDirectors
          .filter((client): client is Client => 
            client !== null && client.medicalDirector !== undefined
          );
        setAllClients(validClients);
        setClients(validClients
        );
      } catch (err) {
        console.error('Error fetching medical directors:', err);
        setError('Failed to load medical directors');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

  useEffect(() => {
    const searchLower = searchTerm.toLowerCase();
    const filtered = allClients.filter(client => {
      const directorName = `${client.medicalDirector?.firstname} ${client.medicalDirector?.lastname}`.toLowerCase();
      const spaName = client.companyName.toLowerCase();
      return directorName.includes(searchLower) || spaName.includes(searchLower);
    });
    setClients(filtered);
  }, [searchTerm, allClients]);

  return (
    <>
      <div className="flex justify-between items-center mb-8 pt-5 md:pt-10">
        <div>
          <Button
            variant="outline"
            asChild
            className="mb-4"
          >
            <Link to="/medical-directors" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Medical Directors
            </Link>
          </Button>
          <h2 className="text-2xl font-bold">Client Medical Directors</h2>
          <p className="text-gray-500 mt-1">Medical directors assigned to specific clients</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <span className="absolute left-3 top-2.5">🔍</span>
          <input
            type="text"
            placeholder="Search by medical director name or spa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md bg-white"
          />
        </div>
      </div>

      {error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-24 bg-gray-100 rounded"></div>
            </Card>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No medical directors found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {clients.map((client) => (
            <Card key={client.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                  {(client.medicalDirector?.firstname?.[0] || '')}{(client.medicalDirector?.lastname?.[0] || '')}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-lg">
                        Dr. {client.medicalDirector?.firstname} {client.medicalDirector?.lastname}
                      </h3>
                      <div className="text-sm text-gray-500">
                        {client.companyName}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {client.medicalDirector?.status && (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          client.medicalDirector.status === 'active' ? 'bg-green-100 text-green-800' :
                          client.medicalDirector.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {client.medicalDirector.status.charAt(0).toUpperCase() + client.medicalDirector.status.slice(1)}
                        </span>
                      )}
                      {client.medicalDirector?.amount && (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {client.medicalDirector.amount}% Revenue Share
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    <a 
                      href={`mailto:${client.medicalDirector?.email}`} 
                      className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
                    >
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{client.medicalDirector?.email}</span>
                    </a>
                    {client.medicalDirector?.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm">{client.medicalDirector.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Award className="w-4 h-4" />
                      <span className="text-sm">{client.medicalDirector?.licenseType} - {client.medicalDirector?.medicalLicenseNumber}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}