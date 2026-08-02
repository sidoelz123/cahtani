import React, { useState, useEffect } from "react";
import { MapPin, Loader2, CheckCircle2, ChevronDown, RefreshCw } from "lucide-react";
import { apiClient } from "../lib/api";

export interface WilayahItem {
  code: string;
  name: string;
}

interface WilayahLocationPickerProps {
  value: string;
  onChange: (formattedLocation: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export const WilayahLocationPicker: React.FC<WilayahLocationPickerProps> = ({
  value,
  onChange,
  label = "6. LOKASI LENGKAP SAWAH / LADANG (OPEN API WILAYAH.ID):",
  placeholder = "CONTOH: DESA NGAWI, KEC. NGAWI, KAB. NGAWI, JAWA TIMUR",
  required = false,
  className = "",
}) => {
  const [isPickerMode, setIsPickerMode] = useState<boolean>(true);

  // States for API data
  const [provinces, setProvinces] = useState<WilayahItem[]>([]);
  const [regencies, setRegencies] = useState<WilayahItem[]>([]);
  const [districts, setDistricts] = useState<WilayahItem[]>([]);
  const [villages, setVillages] = useState<WilayahItem[]>([]);

  // Selected codes
  const [selectedProv, setSelectedProv] = useState<string>("");
  const [selectedReg, setSelectedReg] = useState<string>("");
  const [selectedDist, setSelectedDist] = useState<string>("");
  const [selectedVill, setSelectedVill] = useState<string>("");

  // Loading states
  const [loadingProvinces, setLoadingProvinces] = useState<boolean>(false);
  const [loadingRegencies, setLoadingRegencies] = useState<boolean>(false);
  const [loadingDistricts, setLoadingDistricts] = useState<boolean>(false);
  const [loadingVillages, setLoadingVillages] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Helper fetcher with backend proxy fallback
  const fetchWilayahApi = async (path: string): Promise<WilayahItem[]> => {
    try {
      const proxyRes = await apiClient.get(`/api/wilayah/${path}`);
      if (proxyRes.ok) {
        const json = await proxyRes.json();
        if (Array.isArray(json.data)) return json.data;
      }
    } catch (err) {
      console.warn(`Wilayah proxy fetch failed for ${path}, trying direct link:`, err);
    }

    // Fallback to direct URL
    const directRes = await apiClient.get(`https://wilayah.id/api/${path}`);
    if (!directRes.ok) throw new Error(`Gagal mengambil data dari wilayah.id (${directRes.status})`);
    const json = await directRes.json();
    if (Array.isArray(json.data)) return json.data;
    throw new Error("Format data wilayah.id tidak sesuai");
  };

  // Fetch Provinces on Mount
  useEffect(() => {
    let isMounted = true;
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      setApiError(null);
      try {
        const data = await fetchWilayahApi("provinces.json");
        if (isMounted) {
          setProvinces(data);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Wilayah.id Provinces Error:", err);
          setApiError("Koneksi API wilayah.id tidak merespons. Anda dapat mengetik manual.");
        }
      } finally {
        if (isMounted) setLoadingProvinces(false);
      }
    };

    fetchProvinces();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Regencies when province changes
  useEffect(() => {
    if (!selectedProv) {
      setRegencies([]);
      setSelectedReg("");
      setDistricts([]);
      setSelectedDist("");
      setVillages([]);
      setSelectedVill("");
      return;
    }

    let isMounted = true;
    const fetchRegencies = async () => {
      setLoadingRegencies(true);
      setRegencies([]);
      setSelectedReg("");
      setDistricts([]);
      setSelectedDist("");
      setVillages([]);
      setSelectedVill("");

      try {
        const data = await fetchWilayahApi(`regencies/${selectedProv}.json`);
        if (isMounted) {
          setRegencies(data);
        }
      } catch (err: any) {
        console.error("Wilayah.id Regencies Error:", err);
      } finally {
        if (isMounted) setLoadingRegencies(false);
      }
    };

    fetchRegencies();
    return () => {
      isMounted = false;
    };
  }, [selectedProv]);

  // Fetch Districts when regency changes
  useEffect(() => {
    if (!selectedReg) {
      setDistricts([]);
      setSelectedDist("");
      setVillages([]);
      setSelectedVill("");
      return;
    }

    let isMounted = true;
    const fetchDistricts = async () => {
      setLoadingDistricts(true);
      setDistricts([]);
      setSelectedDist("");
      setVillages([]);
      setSelectedVill("");

      try {
        const data = await fetchWilayahApi(`districts/${selectedReg}.json`);
        if (isMounted) {
          setDistricts(data);
        }
      } catch (err: any) {
        console.error("Wilayah.id Districts Error:", err);
      } finally {
        if (isMounted) setLoadingDistricts(false);
      }
    };

    fetchDistricts();
    return () => {
      isMounted = false;
    };
  }, [selectedReg]);

  // Fetch Villages when district changes
  useEffect(() => {
    if (!selectedDist) {
      setVillages([]);
      setSelectedVill("");
      return;
    }

    let isMounted = true;
    const fetchVillages = async () => {
      setLoadingVillages(true);
      setVillages([]);
      setSelectedVill("");

      try {
        const data = await fetchWilayahApi(`villages/${selectedDist}.json`);
        if (isMounted) {
          setVillages(data);
        }
      } catch (err: any) {
        console.error("Wilayah.id Villages Error:", err);
      } finally {
        if (isMounted) setLoadingVillages(false);
      }
    };

    fetchVillages();
    return () => {
      isMounted = false;
    };
  }, [selectedDist]);

  // Format and update parent value when dropdown selection changes
  const updateFormattedValue = (
    provCode: string,
    regCode: string,
    distCode: string,
    villCode: string
  ) => {
    const provObj = provinces.find((p) => p.code === provCode);
    const regObj = regencies.find((r) => r.code === regCode);
    const distObj = districts.find((d) => d.code === distCode);
    const villObj = villages.find((v) => v.code === villCode);

    const parts: string[] = [];
    if (villObj) parts.push(`Desa/Kel. ${villObj.name}`);
    if (distObj) parts.push(`Kec. ${distObj.name}`);
    if (regObj) parts.push(regObj.name);
    if (provObj) parts.push(provObj.name);

    if (parts.length > 0) {
      onChange(parts.join(", "));
    }
  };

  const handleProvChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedProv(val);
    updateFormattedValue(val, "", "", "");
  };

  const handleRegChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedReg(val);
    updateFormattedValue(selectedProv, val, "", "");
  };

  const handleDistChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedDist(val);
    updateFormattedValue(selectedProv, selectedReg, val, "");
  };

  const handleVillChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedVill(val);
    updateFormattedValue(selectedProv, selectedReg, selectedDist, val);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#14201A] flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#15803D]" />
          <span>{label}</span>
        </label>
        <button
          type="button"
          onClick={() => setIsPickerMode(!isPickerMode)}
          className="text-[11px] font-bold text-[#15803D] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          <span>{isPickerMode ? "Ganti ke Input Manual" : "Pilih via Wilayah.id"}</span>
        </button>
      </div>

      {apiError && isPickerMode && (
        <div className="p-2 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-medium rounded">
          {apiError}
        </div>
      )}

      {isPickerMode ? (
        <div className="space-y-2 p-3 bg-[#E7ECE2] border-2 border-[#3A4A3E]">
          {/* PROVINSI */}
          <div>
            <label className="block text-[10px] font-black uppercase text-gray-700 mb-1">
              PROVINSI {loadingProvinces && <Loader2 className="w-3 h-3 animate-spin inline ml-1 text-[#15803D]" />}
            </label>
            <div className="relative">
              <select
                value={selectedProv}
                onChange={handleProvChange}
                disabled={loadingProvinces}
                className="w-full h-10 bg-white border-2 border-[#3A4A3E] px-3 font-bold text-xs uppercase text-[#14201A] focus:outline-none focus:border-[#15803D] cursor-pointer"
              >
                <option value="">-- PILIH PROVINSI --</option>
                {provinces.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* KABUPATEN / KOTA */}
          {selectedProv && (
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-700 mb-1">
                KABUPATEN / KOTA {loadingRegencies && <Loader2 className="w-3 h-3 animate-spin inline ml-1 text-[#15803D]" />}
              </label>
              <select
                value={selectedReg}
                onChange={handleRegChange}
                disabled={loadingRegencies || regencies.length === 0}
                className="w-full h-10 bg-white border-2 border-[#3A4A3E] px-3 font-bold text-xs uppercase text-[#14201A] focus:outline-none focus:border-[#15803D] cursor-pointer"
              >
                <option value="">-- PILIH KABUPATEN / KOTA --</option>
                {regencies.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* KECAMATAN */}
          {selectedReg && (
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-700 mb-1">
                KECAMATAN {loadingDistricts && <Loader2 className="w-3 h-3 animate-spin inline ml-1 text-[#15803D]" />}
              </label>
              <select
                value={selectedDist}
                onChange={handleDistChange}
                disabled={loadingDistricts || districts.length === 0}
                className="w-full h-10 bg-white border-2 border-[#3A4A3E] px-3 font-bold text-xs uppercase text-[#14201A] focus:outline-none focus:border-[#15803D] cursor-pointer"
              >
                <option value="">-- PILIH KECAMATAN --</option>
                {districts.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* DESA / KELURAHAN */}
          {selectedDist && (
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-700 mb-1">
                DESA / KELURAHAN {loadingVillages && <Loader2 className="w-3 h-3 animate-spin inline ml-1 text-[#15803D]" />}
              </label>
              <select
                value={selectedVill}
                onChange={handleVillChange}
                disabled={loadingVillages || villages.length === 0}
                className="w-full h-10 bg-white border-2 border-[#3A4A3E] px-3 font-bold text-xs uppercase text-[#14201A] focus:outline-none focus:border-[#15803D] cursor-pointer"
              >
                <option value="">-- PILIH DESA / KELURAHAN --</option>
                {villages.map((v) => (
                  <option key={v.code} value={v.code}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* DISPLAY VALUE RESULT */}
          <div className="pt-2">
            <span className="text-[10px] font-black uppercase text-gray-600 block mb-0.5">HASIL ALAMAT TERPILIH:</span>
            <input
              type="text"
              readOnly
              required={required}
              value={value}
              placeholder="Sila pilih wilayah di atas..."
              className="w-full bg-white border border-[#3A4A3E] px-3 py-1.5 font-bold text-xs text-[#15803D] uppercase focus:outline-none"
            />
          </div>
        </div>
      ) : (
        /* MANUAL INPUT FALLBACK */
        <input
          type="text"
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-12 bg-[#E7ECE2] border-2 border-[#3A4A3E] px-4 font-bold text-base text-[#14201A] uppercase focus:outline-none focus:border-[#15803D] placeholder:text-[#8B9A8E]"
        />
      )}
    </div>
  );
};
