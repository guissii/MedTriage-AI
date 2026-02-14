import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Search, 
  User, 
  Calendar, 
  FileText, 
  ChevronRight,
  Plus,
  AlertCircle
} from 'lucide-react';
import { mockPatients, mockConsultations } from '@/data/mockData';
import { formatDate, calculateAge, getInitials } from '@/lib/utils';
import type { Patient } from '@/types';

export function PatientRecordsSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const filteredPatients = mockPatients.filter(patient => 
    patient.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPatientConsultations = (patientId: string) => {
    return mockConsultations.filter(c => c.patientId === patientId);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Patient Records</h1>
          <p className="text-sm text-muted-foreground">
            Manage and view patient information
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Patient
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Patient List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-[600px] overflow-auto">
              {filteredPatients.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => setSelectedPatient(patient)}
                  className={`w-full flex items-center gap-3 p-4 text-left hover:bg-muted transition-colors ${
                    selectedPatient?.id === patient.id ? 'bg-primary/5' : ''
                  }`}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(`${patient.firstName} ${patient.lastName}`)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {patient.firstName} {patient.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ID: {patient.id} · {calculateAge(patient.dateOfBirth)} yrs
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Patient Details */}
        <Card className="lg:col-span-2">
          {selectedPatient ? (
            <div className="p-6">
              {/* Patient Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {getInitials(`${selectedPatient.firstName} ${selectedPatient.lastName}`)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-bold">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </h2>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span>{calculateAge(selectedPatient.dateOfBirth)} years old</span>
                      <span>·</span>
                      <span className="capitalize">{selectedPatient.gender}</span>
                      <span>·</span>
                      <span>ID: {selectedPatient.id}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <FileText className="w-4 h-4" />
                    View History
                  </Button>
                  <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Consultation
                  </Button>
                </div>
              </div>

              {/* Patient Info Grid */}
              <div className="grid sm:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Demographics
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Weight</span>
                      <span>{selectedPatient.weight} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Height</span>
                      <span>{selectedPatient.height} cm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">BMI</span>
                      <span>{(selectedPatient.weight / Math.pow(selectedPatient.height / 100, 2)).toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date of Birth</span>
                      <span>{formatDate(selectedPatient.dateOfBirth)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-primary" />
                    Medical Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Medical History</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedPatient.medicalHistory.length > 0 ? (
                          selectedPatient.medicalHistory.map((item) => (
                            <Badge key={item} variant="secondary" className="text-xs">
                              {item}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">None reported</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Allergies</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedPatient.allergies.length > 0 ? (
                          selectedPatient.allergies.map((item) => (
                            <Badge key={item} variant="destructive" className="text-xs">
                              {item}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">None reported</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Medications */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Current Medications</h3>
                {selectedPatient.currentMedications.length > 0 ? (
                  <div className="space-y-2">
                    {selectedPatient.currentMedications.map((med, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div>
                          <div className="font-medium">{med.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {med.dosage} · {med.frequency}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No current medications</p>
                )}
              </div>

              {/* Consultation History */}
              <div>
                <h3 className="font-semibold mb-3">Recent Consultations</h3>
                <div className="space-y-2">
                  {getPatientConsultations(selectedPatient.id).map((consultation) => (
                    <div 
                      key={consultation.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">
                            Consultation #{consultation.id}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(consultation.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={consultation.status === 'completed' ? 'default' : 'secondary'}
                        >
                          {consultation.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {getPatientConsultations(selectedPatient.id).length === 0 && (
                    <p className="text-sm text-muted-foreground">No consultations yet</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[500px] text-center p-6">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Select a Patient</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Choose a patient from the list to view their complete medical record and consultation history.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
