export interface User {
  id: string;
  name: string;
  emailOrPhone: string;
  email?: string;
  phone?: string;
  password?: string;
  isVerified?: boolean;
  gender: string;
  location: string;
  crops: string;
  joinedDate: string;
  role?: "admin" | "farmer";
}

export interface FarmerProfile {
  name: string;
  gender: string; // e.g. "Bapak (Pria)" | "Ibu (Wanita)"
  location: string; // full location: desa, kecamatan, kabupaten, provinsi
  crops: string; // crops grown by the farmer
}

export interface PlantGrowthLog {
  id: string;
  cropName: string;
  stage: "Pembibitan" | "Vegetatif" | "Generatif" | "Siap Panen";
  heightCm: number;
  notes: string;
  photoBase64?: string;
  date: string;
}

export interface WeatherData {
  location: string;
  tempC: number;
  airHumidity: number;
  soilHumidity: number;
  rainProbability: number;
  windSpeedKmH: number;
  condition: string;
  fertilizationAdvice: string;
  sprayingAdvice: string;
}

export interface PlantingMilestone {
  id: string;
  date: string;
  stageName: string;
  category: "Olahan Tanah" | "Pupuk 1" | "Pupuk 2" | "Cek Hama" | "Panen";
  notes: string;
  completed: boolean;
}

export interface PlantingSchedule {
  id: string;
  cropType: string;
  startDate: string;
  harvestTargetDate: string;
  milestones: PlantingMilestone[];
}

export interface CustomReminder {
  id: string;
  title: string;
  category: "Tanam" | "Pupuk" | "Pestisida" | "Irigasi" | "Panen";
  dueDate: string;
  notes: string;
  completed: boolean;
}

export interface DiagnosisRequest {
  cropType: string;
  symptoms: string;
  region: string;
  imageBase64?: string;
  mimeType?: string;
  farmerProfile?: FarmerProfile;
}

export interface DiagnosisResult {
  diseaseName: string;
  severity: "RINGAN" | "SEDANG" | "PARAH" | "KRITIS";
  cause: string;
  immediateAction: string[];
  organicTreatment: string[];
  chemicalTreatment: string[];
  prevention: string[];
  rawMarkdown: string;
}

export interface PestDiseaseItem {
  id: string;
  name: string;
  crop: string;
  category: "HAMA" | "PENYAKIT" | "GANGGUAN NUTRISI";
  symptoms: string;
  solutionQuick: string;
  iconName: string;
  tag: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  location: string;
  crop: string;
  quote: string;
  impact: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

export interface FaqItem {
  question: string;
  answer: string;
  category: string;
}
