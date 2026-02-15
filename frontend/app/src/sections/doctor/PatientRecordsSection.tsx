import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  User, 
  Calendar as CalendarIcon,
  ChevronRight,
  Plus,
  AlertCircle,
  MessageSquare,
  FileText,
  Activity,
  Scan
} from 'lucide-react';
import { formatDate, calculateAge, getInitials } from '@/lib/utils';
import { doctorApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useT } from '@/context/LangContext';
import type { Patient } from '@/types';

export function PatientRecordsSection() {
  const { user } = useAuth();
  const t = useT();
  const doctorId = user?.id || 'default_doc';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newPatient, setNewPatient] = useState({ first_name: '', last_name: '', date_of_birth: '', gender: '' });
  const [newPatientDob, setNewPatientDob] = useState<Date | undefined>(undefined);
  const [error, setError] = useState('');
  const [isSavingDemographics, setIsSavingDemographics] = useState(false);
  const [editWeightKg, setEditWeightKg] = useState<string>('');
  const [editHeightCm, setEditHeightCm] = useState<string>('');
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanNotes, setScanNotes] = useState('');
  const [scanType, setScanType] = useState('xray');
  const [rxItems, setRxItems] = useState([{ name: '', dosage: '', frequency: '', duration: '', notes: '' }]);
  const [rxNotes, setRxNotes] = useState('');
  const [timeline, setTimeline] = useState<Array<any>>([]);
  const [filterType, setFilterType] = useState<'all' | 'analysis' | 'chat' | 'scan' | 'prescription'>('all');
  const [showDetail, setShowDetail] = useState(false);
  const [detailItem, setDetailItem] = useState<any>(null);
  const visibleItems = timeline.filter((it) => filterType === 'all' || it.type === filterType);
  const filterOptions: Array<'all' | 'analysis' | 'chat' | 'scan' | 'prescription'> = ['all','analysis','chat','scan','prescription'];

  useEffect(() => {
    const load = async () => {
      try {
        const data = await doctorApi.listPatients(doctorId);
        setPatients(data);
      } catch {
        // silently ignore in demo if backend not ready
      }
    };
    load();
  }, [doctorId]);

  const filteredPatients = patients.filter((patient) => {
    const fn = String(patient.firstName ?? patient.first_name ?? '').toLowerCase();
    const ln = String(patient.lastName ?? patient.last_name ?? '').toLowerCase();
    const idStr = String(patient.id ?? '');
    const q = searchQuery.toLowerCase();
    return fn.includes(q) || ln.includes(q) || idStr.includes(q);
  });

  const selectedPatientId = selectedPatient?.id;
  useEffect(() => {
    const loadTimeline = async () => {
      if (!selectedPatientId) return;
      try {
        const items = await doctorApi.timeline(doctorId, Number(selectedPatientId));
        setTimeline(items);
      } catch {
        setTimeline([]);
      }
    };
    loadTimeline();
  }, [doctorId, selectedPatientId]);

  const syncEditsFromPatient = (p: any) => {
    const w = p?.weight_kg ?? p?.weight ?? '';
    const h = p?.height_cm ?? p?.height ?? '';
    setEditWeightKg(w === null || w === undefined ? '' : String(w));
    setEditHeightCm(h === null || h === undefined ? '' : String(h));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('patients.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('patients.subtitle')}
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="w-4 h-4" />
          {t('patients.add')}
        </Button>
      </div>

      {showAdd && (
        <Card className="p-4">
          {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
          <div className="grid sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label>Prénom</Label>
              <Input
                placeholder="Prénom"
                value={newPatient.first_name}
                onChange={(e) => setNewPatient({ ...newPatient, first_name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Nom</Label>
              <Input
                placeholder="Nom"
                value={newPatient.last_name}
                onChange={(e) => setNewPatient({ ...newPatient, last_name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Date de naissance</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    <span className="truncate">
                      {newPatientDob
                        ? newPatientDob.toISOString().slice(0, 10)
                        : 'Choisir une date'}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="p-0 w-auto">
                  <Calendar
                    mode="single"
                    selected={newPatientDob}
                    onSelect={(d) => {
                      setNewPatientDob(d ?? undefined);
                      const iso = d ? d.toISOString().slice(0, 10) : '';
                      setNewPatient((prev) => ({ ...prev, date_of_birth: iso }));
                    }}
                    disabled={{ after: new Date() }}
                    captionLayout="dropdown"
                    fromYear={1900}
                    toYear={new Date().getFullYear()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label>Genre</Label>
              <RadioGroup
                value={newPatient.gender}
                onValueChange={(v) => setNewPatient((prev) => ({ ...prev, gender: v }))}
                className="grid grid-cols-2 gap-2"
              >
                <label className="flex items-center gap-2 rounded-md border px-3 h-9 cursor-pointer">
                  <RadioGroupItem value="male" />
                  <span className="text-sm">Homme</span>
                </label>
                <label className="flex items-center gap-2 rounded-md border px-3 h-9 cursor-pointer">
                  <RadioGroupItem value="female" />
                  <span className="text-sm">Femme</span>
                </label>
              </RadioGroup>
            </div>
          </div>
          <div className="mt-3">
            <Button
              onClick={async () => {
                setError('');
                try {
                  if (!newPatient.first_name.trim() || !newPatient.last_name.trim()) {
                    setError('Veuillez saisir le prénom et le nom.');
                    return;
                  }
                  if (!newPatient.date_of_birth) {
                    setError('Veuillez choisir la date de naissance.');
                    return;
                  }
                  if (newPatient.gender !== 'male' && newPatient.gender !== 'female') {
                    setError('Veuillez choisir le genre (Homme/Femme).');
                    return;
                  }
                  const created = await doctorApi.createPatient({ doctor_id: doctorId, ...newPatient });
                  setPatients((prev) => [
                    created,
                    ...prev.filter((p: any) => String(p?.id) !== String(created.id)),
                  ]);
                  setShowAdd(false);
                  setNewPatient({ first_name: '', last_name: '', date_of_birth: '', gender: '' });
                  setNewPatientDob(undefined);
                  // auto-select new patient
                  setSelectedPatient({ 
                    id: String(created.id),
                    firstName: created.first_name || newPatient.first_name,
                    lastName: created.last_name || newPatient.last_name,
                    dateOfBirth: created.date_of_birth || newPatient.date_of_birth,
                    gender: created.gender || newPatient.gender,
                    weight_kg: null,
                    height_cm: null,
                    medicalHistory: [],
                    allergies: [],
                    currentMedications: [],
                  } as any);
                  syncEditsFromPatient({ weight_kg: null, height_cm: null });
                } catch (e: any) {
                  setError(e?.message || 'Impossible de créer le patient.');
                }
              }}
            >
              Enregistrer le patient
            </Button>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Patient List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('common.searchPatients')}
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
                  onClick={async () => {
                    setError('');
                    setSelectedPatient(patient);
                    syncEditsFromPatient(patient);
                    try {
                      const detail = await doctorApi.getPatient(doctorId, Number(patient.id));
                      const merged = {
                        ...patient,
                        ...detail,
                        weight_kg: detail.weight_kg ?? (patient as any).weight_kg ?? (patient as any).weight ?? null,
                        height_cm: detail.height_cm ?? (patient as any).height_cm ?? (patient as any).height ?? null,
                        medicalHistory: Array.isArray(detail.medical_history) ? detail.medical_history : (patient as any).medicalHistory ?? [],
                        allergies: Array.isArray(detail.allergies) ? detail.allergies : (patient as any).allergies ?? [],
                        currentMedications: Array.isArray(detail.current_medications) ? detail.current_medications : (patient as any).currentMedications ?? [],
                      };
                      setSelectedPatient(merged as any);
                      syncEditsFromPatient(merged);
                    } catch {}
                  }}
                  className={`w-full flex items-center gap-3 p-4 text-left hover:bg-muted transition-colors ${
                    selectedPatient?.id === patient.id ? 'bg-primary/5' : ''
                  }`}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(`${patient.firstName ?? patient.first_name} ${patient.lastName ?? patient.last_name}`)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {(patient.firstName ?? patient.first_name)} {(patient.lastName ?? patient.last_name)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ID: {patient.id} · {calculateAge(patient.dateOfBirth ?? patient.date_of_birth)} ans
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
                      {getInitials(`${(selectedPatient as any).firstName ?? (selectedPatient as any).first_name} ${(selectedPatient as any).lastName ?? (selectedPatient as any).last_name}`)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-bold">
                      {(selectedPatient as any).firstName ?? (selectedPatient as any).first_name} {(selectedPatient as any).lastName ?? (selectedPatient as any).last_name}
                    </h2>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span>{calculateAge((selectedPatient as any).dateOfBirth ?? (selectedPatient as any).date_of_birth)} ans</span>
                      <span>·</span>
                      <span className="capitalize">
                        {(selectedPatient as any).gender === 'male' ? 'Homme' : (selectedPatient as any).gender === 'female' ? 'Femme' : (selectedPatient as any).gender}
                      </span>
                      <span>·</span>
                      <span>ID: {selectedPatient.id}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="file"
                      onChange={(e) => setScanFile(e.target.files?.[0] || null)}
                    />
                    <span>Scan</span>
                  </label>
                  <Input
                    placeholder="Type (ex: xray, ct)"
                    value={scanType}
                    onChange={(e) => setScanType(e.target.value)}
                    className="w-36"
                  />
                  <Input
                    placeholder="Notes"
                    value={scanNotes}
                    onChange={(e) => setScanNotes(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={async () => {
                      if (!scanFile) return;
                      await doctorApi.uploadScan({
                        doctor_id: doctorId,
                        patient_id: Number(selectedPatient.id),
                        scan_type: scanType,
                        notes: scanNotes,
                        file: scanFile,
                      });
                      setScanFile(null);
                      setScanNotes('');
                      try {
                        const items = await doctorApi.timeline(doctorId, Number((selectedPatient as any).id));
                        setTimeline(items);
                      } catch {}
                    }}
                  >
                    Ajouter scan
                  </Button>
                </div>
              </div>

              {/* Patient Info Grid */}
              <div className="grid sm:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Démographie
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Poids (kg)</span>
                      <Input
                        value={editWeightKg}
                        onChange={(e) => setEditWeightKg(e.target.value)}
                        className="w-24 h-8 text-right"
                        inputMode="decimal"
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taille (cm)</span>
                      <Input
                        value={editHeightCm}
                        onChange={(e) => setEditHeightCm(e.target.value)}
                        className="w-24 h-8 text-right"
                        inputMode="decimal"
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IMC</span>
                      <span>
                        {(() => {
                          const w = parseFloat(editWeightKg);
                          const h = parseFloat(editHeightCm);
                          if (!Number.isFinite(w) || !Number.isFinite(h) || h <= 0) return '--';
                          return (w / Math.pow(h / 100, 2)).toFixed(1);
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date de naissance</span>
                      <span>{formatDate((selectedPatient as any).dateOfBirth ?? (selectedPatient as any).date_of_birth)}</span>
                    </div>
                    <div className="pt-2">
                      <Button
                        size="sm"
                        disabled={isSavingDemographics}
                        onClick={async () => {
                          setError('');
                          const w = editWeightKg.trim() ? Number(editWeightKg) : null;
                          const h = editHeightCm.trim() ? Number(editHeightCm) : null;
                          if (w !== null && (!Number.isFinite(w) || w <= 0)) {
                            setError('Poids invalide.');
                            return;
                          }
                          if (h !== null && (!Number.isFinite(h) || h <= 0)) {
                            setError('Taille invalide.');
                            return;
                          }
                          setIsSavingDemographics(true);
                          try {
                            const updated = await doctorApi.updatePatient(doctorId, Number((selectedPatient as any).id), {
                              weight_kg: w,
                              height_cm: h,
                            });
                            setSelectedPatient((prev) => ({
                              ...(prev as any),
                              weight_kg: updated.weight_kg ?? null,
                              height_cm: updated.height_cm ?? null,
                            }) as any);
                            setPatients((prev) =>
                              prev.map((p: any) =>
                                String(p?.id) === String((selectedPatient as any).id)
                                  ? { ...p, weight_kg: updated.weight_kg ?? null, height_cm: updated.height_cm ?? null }
                                  : p
                              )
                            );
                          } catch (e: any) {
                            setError(e?.message || 'Impossible de sauvegarder.');
                          } finally {
                            setIsSavingDemographics(false);
                          }
                        }}
                      >
                        Enregistrer
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-primary" />
                    Informations médicales
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Antécédents</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(selectedPatient as any).medicalHistory?.length > 0 ? (
                          (selectedPatient as any).medicalHistory.map((item: string) => (
                            <Badge key={item} variant="secondary" className="text-xs">
                              {item}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">Non renseigné</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Allergies</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(selectedPatient as any).allergies?.length > 0 ? (
                          (selectedPatient as any).allergies.map((item: string) => (
                            <Badge key={item} variant="destructive" className="text-xs">
                              {item}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">Non renseigné</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prescription quick add */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Nouvelle ordonnance</h3>
                <div className="space-y-2">
                  {rxItems.map((it, idx) => (
                    <div className="grid sm:grid-cols-5 gap-2" key={idx}>
                      <Input placeholder="Médicament" value={it.name} onChange={(e) => {
                        const v = [...rxItems]; v[idx].name = e.target.value; setRxItems(v);
                      }} />
                      <Input placeholder="Posologie" value={it.dosage} onChange={(e) => {
                        const v = [...rxItems]; v[idx].dosage = e.target.value; setRxItems(v);
                      }} />
                      <Input placeholder="Fréquence" value={it.frequency} onChange={(e) => {
                        const v = [...rxItems]; v[idx].frequency = e.target.value; setRxItems(v);
                      }} />
                      <Input placeholder="Durée" value={it.duration} onChange={(e) => {
                        const v = [...rxItems]; v[idx].duration = e.target.value; setRxItems(v);
                      }} />
                      <Input placeholder="Notes" value={it.notes} onChange={(e) => {
                        const v = [...rxItems]; v[idx].notes = e.target.value; setRxItems(v);
                      }} />
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setRxItems([...rxItems, { name: '', dosage: '', frequency: '', duration: '', notes: '' }])}>+ Ajouter ligne</Button>
                    <Input placeholder="Notes générales" value={rxNotes} onChange={(e) => setRxNotes(e.target.value)} />
                    <Button size="sm" onClick={async () => {
                      try {
                        const res = await doctorApi.createPrescription({
                          doctor_id: doctorId,
                          patient_id: Number(selectedPatient.id),
                          items: rxItems.filter(x => x.name && x.dosage && x.frequency),
                          notes: rxNotes,
                        });
                        doctorApi.openPrescriptionPdf(res.id);
                        try {
                          const items = await doctorApi.timeline(doctorId, Number((selectedPatient as any).id));
                          setTimeline(items);
                        } catch {}
                      } catch {
                        // ignore errors silently for demo
                      }
                    }}>Créer & exporter PDF</Button>
                  </div>
                </div>
              </div>

              {/* Current Medications */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Traitements en cours</h3>
                {(selectedPatient as any).currentMedications?.length > 0 ? (
                  <div className="space-y-2">
                    {(selectedPatient as any).currentMedications.map((med: any, index: number) => (
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
                  <p className="text-sm text-muted-foreground">Aucun traitement renseigné</p>
                )}
              </div>

              {/* Historique */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Historique</h3>
                  <div className="flex gap-2">
                    {filterOptions.map(t => (
                      <Button key={t} size="sm" variant={filterType === t ? 'default' : 'outline'} onClick={() => setFilterType(t)}>
                        {t === 'all' ? 'Tous' : t.charAt(0).toUpperCase() + t.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  {visibleItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {item.type === 'analysis' ? (
                            <Activity className="w-5 h-5 text-primary" />
                          ) : item.type === 'scan' ? (
                            <Scan className="w-5 h-5 text-primary" />
                          ) : item.type === 'prescription' ? (
                            <FileText className="w-5 h-5 text-primary" />
                          ) : (
                            <MessageSquare className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">
                            {item.type === 'analysis' ? `Analyse #${item.id ?? ''}` 
                              : item.type === 'scan' ? `Scan #${item.id ?? ''} (${item.scan_type || '—'})`
                              : item.type === 'prescription' ? `Prescription #${item.id ?? ''}`
                              : `${item.role}: ${item.content?.slice(0, 60)}`}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(item.ts || '')}
                          </div>
                          {item.type === 'analysis' && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {item.orientation ? <Badge variant="secondary">{item.orientation}</Badge> : null}
                              {item.flags && Object.entries(item.flags).map(([k, v]) => (
                                <Badge key={k} variant={v ? 'default' : 'outline'} className="text-xs">{k}:{String(v)}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => { setDetailItem(item); setShowDetail(true); }}>
                        Voir détail
                      </Button>
                    </div>
                  ))}
                  {timeline.length === 0 && (
                    <p className="text-sm text-muted-foreground">Pas d’historique</p>
                  )}
                </div>
              </div>
              <Dialog open={showDetail} onOpenChange={(o) => { setShowDetail(o); if (!o) setDetailItem(null); }}>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>
                      {detailItem?.type === 'analysis' ? `Analyse #${detailItem?.id}` 
                        : detailItem?.type === 'scan' ? `Scan #${detailItem?.id}`
                        : detailItem?.type === 'prescription' ? `Prescription #${detailItem?.id}` 
                        : 'Message'}
                    </DialogTitle>
                    <DialogDescription>{formatDate(detailItem?.ts || '')}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    {detailItem?.type === 'analysis' && (
                      <div className="space-y-2">
                        {detailItem.orientation ? <div><span className="text-sm text-muted-foreground">Orientation:</span> <span>{detailItem.orientation}</span></div> : null}
                        {detailItem.clinical_reasoning ? <div><span className="text-sm text-muted-foreground">Raisonnement clinique:</span><div className="mt-1 text-sm">{detailItem.clinical_reasoning}</div></div> : null}
                        {detailItem.risks ? <div><span className="text-sm text-muted-foreground">Risques:</span><div className="mt-1 text-sm">{String(detailItem.risks)}</div></div> : null}
                        {detailItem.flags ? (
                          <div>
                            <span className="text-sm text-muted-foreground">Flags biologiques</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {Object.entries(detailItem.flags).map(([k, v]) => (<Badge key={String(k)} variant={v ? 'default':'outline'} className="text-xs">{String(k)}:{String(v)}</Badge>))}
                            </div>
                          </div>
                        ) : null}
                        <div className="pt-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              const pid = Number((selectedPatient as any)?.id);
                              if (!pid) return;
                              window.open(
                                `http://localhost:8000/api/consultation/${detailItem.id}/pdf?doctor_id=${encodeURIComponent(doctorId)}&patient_id=${encodeURIComponent(String(pid))}`,
                                '_blank'
                              );
                            }}
                          >
                            Exporter PDF
                          </Button>
                        </div>
                      </div>
                    )}
                    {detailItem?.type === 'chat' && (
                      <div className="text-sm">
                        <div className="text-muted-foreground mb-1">{detailItem.role}</div>
                        <div className="whitespace-pre-wrap">{detailItem.content}</div>
                      </div>
                    )}
                    {detailItem?.type === 'scan' && (
                      <div className="text-sm space-y-2">
                        <div><span className="text-muted-foreground">Type: </span>{detailItem.scan_type || '—'}</div>
                        <div><span className="text-muted-foreground">Notes: </span>{detailItem.notes || '—'}</div>
                        {detailItem.file_path ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const raw = String(detailItem.file_path);
                              const rel = raw.replace(/^[A-Za-z]:[\\/]/, '').replace(/^uploads[\\/]/, '').replace(/\\/g, '/');
                              window.open(`http://localhost:8000/files/${rel}`, '_blank');
                            }}
                          >
                            Ouvrir le scan
                          </Button>
                        ) : null}
                      </div>
                    )}
                    {detailItem?.type === 'prescription' && (
                      <div className="text-sm space-y-2">
                        <div><span className="text-muted-foreground">Notes: </span>{detailItem.notes || '—'}</div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (detailItem?.id) doctorApi.openPrescriptionPdf(Number(detailItem.id));
                          }}
                        >
                          Ouvrir PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (Array.isArray(detailItem.items)) {
                              setRxItems(
                                detailItem.items.map((x: any) => ({
                                  name: x?.name || '',
                                  dosage: x?.dosage || '',
                                  frequency: x?.frequency || '',
                                  duration: x?.duration || '',
                                  notes: x?.notes || '',
                                }))
                              );
                              setRxNotes(detailItem.notes || '');
                              setShowDetail(false);
                            }
                          }}
                        >
                          Modifier (recharger)
                        </Button>
                        {Array.isArray(detailItem.items) && detailItem.items.length > 0 ? (
                          <div className="space-y-1">
                            {detailItem.items.map((it: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between rounded border p-2">
                                <div>
                                  <div className="font-medium">{it.name}</div>
                                  <div className="text-xs text-muted-foreground">{it.dosage} · {it.frequency} {it.duration ? `· ${it.duration}` : ''}</div>
                                </div>
                                {it.notes ? <div className="text-xs">{it.notes}</div> : null}
                              </div>
                            ))}
                          </div>
                        ) : <div className="text-sm text-muted-foreground">Aucun item</div>}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[500px] text-center p-6">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Sélectionner un patient</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Choisissez un patient dans la liste pour voir son dossier et l’historique.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
