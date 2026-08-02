import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Filter,
  ShoppingBag,
  Sparkles,
  Star,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
  Copy,
  ArrowRight,
  MessageSquare,
  TrendingUp,
  HelpCircle,
  AlertCircle,
  Plus,
  Edit3,
  Trash2,
  RotateCcw,
  Shield,
  CheckCircle2,
} from "lucide-react";
import { Header } from "../components/Header";
import { FooterSection } from "../components/FooterSection";
import { FixedBottomNav } from "../components/FixedBottomNav";
import { ShopProduct } from "../data/shopProducts";
import { User } from "../types";
import { AdminGuard, isAdminUser } from "../components/AdminGuard";

interface ShopPageProps {
  currentUser: User | null;
  onNavigateHome: () => void;
  onNavigateDashboard?: () => void;
  onOpenChat: () => void;
  onOpenAuthModal: (mode?: "login" | "signup") => void;
  onLogout: () => void;
}

export const ShopPage: React.FC<ShopPageProps> = ({
  currentUser,
  onNavigateHome,
  onNavigateDashboard,
  onOpenChat,
  onOpenAuthModal,
  onLogout,
}) => {
  // Check if current user is Admin using Guard helper
  const isAdmin = isAdminUser(currentUser);

  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cropFilter, setCropFilter] = useState<string>("SEMUA");
  const [sortBy, setSortBy] = useState<"POPULAR" | "RATING" | "NAME">("POPULAR");
  const [selectedProductForBuy, setSelectedProductForBuy] = useState<ShopProduct | null>(null);
  const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null);

  // Categories State from API
  const [categoriesList, setCategoriesList] = useState<{ id: string; label: string; icon: string }[]>([]);

  // Products List State with backend API persistence
  const [productsList, setProductsList] = useState<ShopProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);

  // Fetch categories from API
  React.useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setCategoriesList(data.data);
        }
      })
      .catch((err) => console.error("Error fetching categories:", err));
  }, []);

  // Fetch products from API
  const refreshProducts = React.useCallback(() => {
    setLoadingProducts(true);
    fetch("/api/shop/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setProductsList(data.data);
        }
      })
      .catch((err) => console.error("Error fetching products:", err))
      .finally(() => setLoadingProducts(false));
  }, []);

  React.useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  const handleResetDefaultProducts = async () => {
    if (!isAdminUser(currentUser)) return;
    if (window.confirm("Apakah Anda yakin ingin mengembalikan katalog ke daftar produk bawaan awal?")) {
      try {
        const res = await fetch("/api/shop/reset-defaults", { method: "POST" });
        const data = await res.json();
        if (data.success) {
          refreshProducts();
        } else {
          alert(data.error || "Gagal mengembalikan katalog.");
        }
      } catch (err: any) {
        alert("Terjadi kesalahan: " + (err?.message || err));
      }
    }
  };

  // Product CRUD Modal States
  const [isProductCrudModalOpen, setIsProductCrudModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<ShopProduct | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ShopProduct | null>(null);

  // Product Form State for Create/Update
  const [productFormData, setProductFormData] = useState<Partial<ShopProduct>>({});

  const handleOpenAddProduct = () => {
    if (!isAdminUser(currentUser)) return;
    setEditingProduct(null);
    setProductFormData({
      category: "PUPUK",
      rating: 4.8,
      reviewsCount: 150,
      soldCount: "500+ Terjual",
      image: "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?auto=format&fit=crop&w=800&q=80",
      priceRange: "Rp 35.000 - Rp 65.000",
      cropTarget: "Semua Tanaman (Padi, Cabai, Jagung, Sayuran)",
      aiRecommendation: "Formula nutrisi presisi tinggi untuk memaksimalkan hasil panen.",
      dosage: "1-2 sendok per 10-15 Liter air sprayer.",
    });
    setIsProductCrudModalOpen(true);
  };

  const handleOpenEditProduct = (product: ShopProduct) => {
    if (!isAdminUser(currentUser)) return;
    setEditingProduct(product);
    setProductFormData({ ...product });
    setIsProductCrudModalOpen(true);
  };

  const handleSaveProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminUser(currentUser)) return;
    if (!productFormData.name || !productFormData.category) {
      alert("Nama Produk dan Kategori wajib diisi!");
      return;
    }

    try {
      if (editingProduct) {
        // PUT /api/shop/products/:id
        const res = await fetch(`/api/shop/products/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: productFormData.name,
            category: productFormData.category,
            cropTarget: productFormData.cropTarget,
            priceRange: productFormData.priceRange,
            description: productFormData.description,
            aiRecommendation: productFormData.aiRecommendation,
            image: productFormData.image,
            badge: productFormData.badge,
            shopeeSearchKeyword: productFormData.shopeeSearchKeyword,
            tokopediaSearchKeyword: productFormData.tokopediaSearchKeyword,
            tiktokSearchKeyword: productFormData.tiktokSearchKeyword,
            shopeeAffiliateUrl: productFormData.shopeeAffiliateUrl,
            tokopediaAffiliateUrl: productFormData.tokopediaAffiliateUrl,
            tiktokAffiliateUrl: productFormData.tiktokAffiliateUrl,
          }),
        });
        const data = await res.json();
        if (data.success) {
          refreshProducts();
        } else {
          alert(data.error || "Gagal memperbarui produk.");
        }
      } else {
        // POST /api/shop/products
        const res = await fetch("/api/shop/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: productFormData.name,
            category: productFormData.category,
            cropTarget: productFormData.cropTarget,
            priceRange: productFormData.priceRange,
            description: productFormData.description,
            aiRecommendation: productFormData.aiRecommendation,
            image: productFormData.image,
            badge: productFormData.badge,
            shopeeSearchKeyword: productFormData.shopeeSearchKeyword,
            tokopediaSearchKeyword: productFormData.tokopediaSearchKeyword,
            tiktokSearchKeyword: productFormData.tiktokSearchKeyword,
            shopeeAffiliateUrl: productFormData.shopeeAffiliateUrl,
            tokopediaAffiliateUrl: productFormData.tokopediaAffiliateUrl,
            tiktokAffiliateUrl: productFormData.tiktokAffiliateUrl,
            createdBy: currentUser?.id,
          }),
        });
        const data = await res.json();
        if (data.success) {
          refreshProducts();
        } else {
          alert(data.error || "Gagal menambahkan produk.");
        }
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + (err?.message || err));
    }

    setIsProductCrudModalOpen(false);
    setEditingProduct(null);
    setProductFormData({});
  };

  const handleDeleteProductConfirm = async () => {
    if (!isAdminUser(currentUser)) return;
    if (!deletingProduct) return;
    try {
      const res = await fetch(`/api/shop/products/${deletingProduct.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        refreshProducts();
      } else {
        alert(data.error || "Gagal menghapus produk.");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + (err?.message || err));
    }
    setDeletingProduct(null);
  };

  // Affiliate Link Settings Modal State
  const [isAffiliateModalOpen, setIsAffiliateModalOpen] = useState<boolean>(false);
  const [editingAffiliateProduct, setEditingAffiliateProduct] = useState<ShopProduct | null>(null);
  
  // Custom Affiliate Links from localStorage
  const [customAffiliates, setCustomAffiliates] = useState<Record<string, { shopee?: string; tokopedia?: string; tiktok?: string }>>(() => {
    try {
      const saved = localStorage.getItem("cahtani_custom_affiliates");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [globalShopeeTag, setGlobalShopeeTag] = useState<string>(() => {
    return localStorage.getItem("cahtani_global_shopee_tag") || "";
  });
  const [globalTokopediaTag, setGlobalTokopediaTag] = useState<string>(() => {
    return localStorage.getItem("cahtani_global_tokopedia_tag") || "";
  });
  const [globalTiktokTag, setGlobalTiktokTag] = useState<string>(() => {
    return localStorage.getItem("cahtani_global_tiktok_tag") || "";
  });

  // Save Affiliate Settings
  const handleSaveAffiliateConfig = (productId: string, shopeeUrl: string, tokopediaUrl: string, tiktokUrl: string) => {
    if (!isAdminUser(currentUser)) return;
    const updated = {
      ...customAffiliates,
      [productId]: {
        shopee: shopeeUrl.trim() || undefined,
        tokopedia: tokopediaUrl.trim() || undefined,
        tiktok: tiktokUrl.trim() || undefined,
      },
    };
    setCustomAffiliates(updated);
    try {
      localStorage.setItem("cahtani_custom_affiliates", JSON.stringify(updated));
      localStorage.setItem("cahtani_global_shopee_tag", globalShopeeTag);
      localStorage.setItem("cahtani_global_tokopedia_tag", globalTokopediaTag);
      localStorage.setItem("cahtani_global_tiktok_tag", globalTiktokTag);
    } catch (e) {
      console.error(e);
    }
    setEditingAffiliateProduct(null);
  };

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return productsList.filter((product) => {
      // Category Filter
      if (selectedCategory !== "ALL" && product.category !== selectedCategory) {
        return false;
      }
      // Crop Filter
      if (
        cropFilter !== "SEMUA" &&
        !product.cropTarget.toLowerCase().includes(cropFilter.toLowerCase()) &&
        !product.cropTarget.toLowerCase().includes("semua")
      ) {
        return false;
      }
      // Search Query
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchName = product.name.toLowerCase().includes(query);
        const matchDesc = product.description.toLowerCase().includes(query);
        const matchRec = product.aiRecommendation.toLowerCase().includes(query);
        const matchTarget = product.cropTarget.toLowerCase().includes(query);
        if (!matchName && !matchDesc && !matchRec && !matchTarget) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === "RATING") {
        return b.rating - a.rating;
      }
      if (sortBy === "NAME") {
        return a.name.localeCompare(b.name);
      }
      // Default: POPULAR
      return parseFloat(b.soldCount) - parseFloat(a.soldCount);
    });
  }, [productsList, selectedCategory, searchQuery, cropFilter, sortBy]);

  const handleCopyKeyword = (keyword: string) => {
    navigator.clipboard.writeText(keyword);
    setCopiedKeyword(keyword);
    setTimeout(() => setCopiedKeyword(null), 2500);
  };

  const openMarketplaceRedirect = (
    marketplace: "SHOPEE" | "TOKOPEDIA" | "TIKTOK",
    product: ShopProduct
  ) => {
    let url = "";
    const custom = customAffiliates[product.id];

    if (marketplace === "SHOPEE") {
      if (custom?.shopee) {
        url = custom.shopee;
      } else if (product.shopeeAffiliateUrl) {
        url = product.shopeeAffiliateUrl;
      } else {
        url = `https://shopee.co.id/search?keyword=${encodeURIComponent(product.shopeeSearchKeyword)}`;
      }
      if (globalShopeeTag && !url.includes(globalShopeeTag)) {
        url += (url.includes("?") ? "&" : "?") + `af_siteid=${encodeURIComponent(globalShopeeTag)}`;
      }
    } else if (marketplace === "TOKOPEDIA") {
      if (custom?.tokopedia) {
        url = custom.tokopedia;
      } else if (product.tokopediaAffiliateUrl) {
        url = product.tokopediaAffiliateUrl;
      } else {
        url = `https://www.tokopedia.com/search?st=product&q=${encodeURIComponent(product.tokopediaSearchKeyword)}`;
      }
      if (globalTokopediaTag && !url.includes(globalTokopediaTag)) {
        url += (url.includes("?") ? "&" : "?") + `aff_id=${encodeURIComponent(globalTokopediaTag)}`;
      }
    } else if (marketplace === "TIKTOK") {
      if (custom?.tiktok) {
        url = custom.tiktok;
      } else if (product.tiktokAffiliateUrl) {
        url = product.tiktokAffiliateUrl;
      } else {
        url = `https://www.tiktok.com/search?q=${encodeURIComponent(product.tiktokSearchKeyword)}`;
      }
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-[#F7F9F4] text-[#14201A] flex flex-col font-sans">
      {/* Header Navigation */}
      <Header
        onOpenDiagnosis={onNavigateHome}
        onOpenChat={onOpenChat}
        currentUser={currentUser}
        onOpenAuthModal={onOpenAuthModal}
        onLogout={onLogout}
        onNavigateDashboard={onNavigateDashboard}
        onNavigateHome={onNavigateHome}
      />

      {/* Hero Banner Section */}
      <div className="bg-[#14201A] text-[#F7F9F4] border-b-4 border-[#3A4A3E] relative overflow-hidden py-10 md:py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#15803D] text-[#F7F9F4] font-black text-xs uppercase tracking-widest border border-emerald-400">
                <ShoppingBag className="w-4 h-4 text-emerald-300" /> HUB REKOMENDASI PERALATAN & NUTRISI TANI
              </div>
              <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl uppercase tracking-tight leading-none text-[#F7F9F4]">
                KATALOG KEBUTUHAN SAWAH & LADANG PRESI
              </h1>
              <p className="text-emerald-100 font-medium text-sm md:text-base leading-relaxed">
                Rekomendasi racikan pupuk, obat pencegah hama, media tanam steril, benih sertifikat, dan mesin tani teruji. Klik untuk langsung dialihkan ke toko resmi di marketplace langganan Anda.
              </p>
            </div>

            {/* Admin Control Bar vs Regular User Trust Badge */}
            <AdminGuard
              user={currentUser}
              fallback={
                <div className="bg-[#1E2E24] border-2 border-[#3A4A3E] p-4 md:p-5 max-w-xs space-y-3 shrink-0">
                  <p className="text-xs font-bold uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> BANTUAN PEMBELIAN AMAN
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 bg-[#EE4D2D] text-white font-black text-xs uppercase tracking-wider rounded-none">
                      SHOPEE
                    </span>
                    <span className="px-2.5 py-1 bg-[#00AA5B] text-white font-black text-xs uppercase tracking-wider rounded-none">
                      TOKOPEDIA
                    </span>
                    <span className="px-2.5 py-1 bg-[#000000] text-white font-black text-xs uppercase tracking-wider border border-gray-700 rounded-none">
                      TIKTOK SHOP
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-200 font-medium">
                    Semua kartu produk menggunakan link rekomendasi Toko Resmi Shopee, Tokopedia, dan TikTok Shop.
                  </p>
                  <button
                    onClick={() => onOpenAuthModal("login")}
                    className="text-[11px] text-amber-300 underline font-bold uppercase hover:text-amber-100 cursor-pointer flex items-center gap-1"
                  >
                    <span>🔐 Kelola Toko? Masuk Akun Admin</span>
                  </button>
                </div>
              }
            >
              <div className="bg-[#1E2E24] border-2 border-amber-400 p-4 md:p-5 max-w-sm space-y-3 shrink-0 shadow-lg">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-amber-400" /> MODE ADMIN KATALOG & AFILIASI
                  </p>
                  <span className="px-2 py-0.5 bg-amber-400 text-black font-black text-[10px] uppercase">
                    ADMIN
                  </span>
                </div>
                <p className="text-xs text-amber-100 font-medium">
                  Halo, <strong>{currentUser?.name}</strong>! Anda memiliki akses penuh untuk menambah, mengedit, menghapus produk, dan mengelola link afiliasi.
                </p>

                <div className="space-y-2 pt-1">
                  <button
                    onClick={handleOpenAddProduct}
                    className="w-full py-2 bg-amber-400 text-black font-black text-xs uppercase tracking-wider hover:bg-amber-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-amber-500"
                  >
                    <Plus className="w-4 h-4" /> TAMBAH PRODUK BARU
                  </button>

                  <button
                    onClick={() => setIsAffiliateModalOpen(true)}
                    className="w-full py-2 bg-[#15803D] text-[#F7F9F4] font-black text-xs uppercase tracking-wider border border-emerald-400 hover:bg-emerald-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    ⚙️ ATUR LINK AFILIASI SAYA
                  </button>

                  <button
                    onClick={handleResetDefaultProducts}
                    className="w-full py-1.5 bg-[#14201A] text-gray-300 font-bold text-[11px] uppercase tracking-wider border border-gray-600 hover:bg-red-950 hover:text-red-300 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> RESET KATALOG DEFAULT
                  </button>
                </div>
              </div>
            </AdminGuard>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex-1 w-full space-y-8">
        
        {/* Search & Filtering Control Bar */}
        <div className="bg-[#E7ECE2] border-4 border-[#3A4A3E] p-4 md:p-6 shadow-[6px_6px_0px_0px_#3A4A3E] space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            
            {/* Search Input */}
            <div className="relative w-full md:w-1/2">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3F4C42]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari pupuk NPK, Regent, Trichoderma, Sprayer, Benih..."
                className="w-full pl-11 pr-10 py-3 bg-[#F7F9F4] border-2 border-[#3A4A3E] font-bold text-sm text-[#14201A] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#15803D]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-600 font-bold"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Selectors (Crop & Sort) */}
            <div className="flex items-center gap-3 w-full md:w-auto flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-2 bg-[#F7F9F4] border-2 border-[#3A4A3E] px-3 py-2 text-xs font-bold w-full sm:w-auto">
                <Filter className="w-4 h-4 text-[#15803D] shrink-0" />
                <span className="text-[#3F4C42] shrink-0">TANAMAN:</span>
                <input
                  type="text"
                  value={cropFilter === "SEMUA" ? "" : cropFilter}
                  onChange={(e) => setCropFilter(e.target.value || "SEMUA")}
                  placeholder="KETIK TANAMAN (PADI, CABAI...)"
                  className="bg-transparent font-bold text-[#14201A] focus:outline-none w-full uppercase placeholder:text-[#8B9A8E]"
                />
              </div>

              <div className="flex items-center gap-2 bg-[#F7F9F4] border-2 border-[#3A4A3E] px-3 py-2 text-xs font-bold w-full sm:w-auto">
                <TrendingUp className="w-4 h-4 text-[#15803D] shrink-0" />
                <span className="text-[#3F4C42] shrink-0">URUTKAN:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent font-bold text-[#14201A] focus:outline-none cursor-pointer w-full"
                >
                  <option value="POPULAR">PALING POPULER</option>
                  <option value="RATING">RATING TERTINGGI</option>
                  <option value="NAME">NAMA A-Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pt-2 border-t-2 border-[#3A4A3E]/20">
            {categoriesList.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 font-black text-xs uppercase tracking-tight border-2 border-[#3A4A3E] whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? "bg-[#15803D] text-[#F7F9F4] shadow-[2px_2px_0px_0px_#3A4A3E]"
                    : "bg-[#F7F9F4] text-[#14201A] hover:bg-[#14201A] hover:text-[#F7F9F4]"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* AI Consultation Prompt Banner */}
        <div className="bg-[#14201A] text-[#F7F9F4] border-4 border-[#3A4A3E] p-5 shadow-[6px_6px_0px_0px_#3A4A3E] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#15803D] text-[#F7F9F4] border-2 border-[#3A4A3E] shrink-0">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="font-display font-black text-base md:text-lg uppercase text-[#F7F9F4]">
                BINGUNG RACIKAN OBAT ATAU DOSIS PUPUK UNTUK SAWAH ANDA?
              </h3>
              <p className="text-xs md:text-sm text-emerald-200 font-medium">
                Konsultasikan gejala penyakit daun atau foto tanaman Anda ke CahTani AI sebelum membeli produk.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenChat}
            className="w-full sm:w-auto px-5 py-3 bg-[#15803D] text-[#F7F9F4] hover:bg-emerald-900 font-black text-xs md:text-sm uppercase tracking-wider border-2 border-emerald-400 whitespace-nowrap transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <MessageSquare className="w-4 h-4" />
            <span>TANYA CAHTANI AI GRATIS</span>
          </button>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between font-bold text-xs uppercase text-[#3F4C42] px-1">
          <span>MENAMPILKAN {filteredProducts.length} REKOMENDASI PRODUK TANI</span>
          {searchQuery && (
            <span>
              KATA KUNCI: &quot;<strong>{searchQuery}</strong>&quot;
            </span>
          )}
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-[#E7ECE2] border-4 border-[#3A4A3E] p-12 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-amber-700 mx-auto" />
            <h3 className="font-display font-black text-xl uppercase text-[#14201A]">
              PRODUK TIDAK DITEMUKAN
            </h3>
            <p className="text-sm text-[#3F4C42] max-w-md mx-auto font-medium">
              Coba ganti kata kunci pencarian atau ubah filter kategori/tanaman yang Anda pilih.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("ALL");
                setCropFilter("SEMUA");
              }}
              className="px-6 py-2.5 bg-[#15803D] text-[#F7F9F4] font-black text-xs uppercase border-2 border-[#3A4A3E] hover:bg-[#14201A] transition-colors cursor-pointer"
            >
              RESET SEMUA FILTER
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-[#F7F9F4] border-4 border-[#3A4A3E] shadow-[6px_6px_0px_0px_#3A4A3E] flex flex-col justify-between hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#3A4A3E] transition-all group"
              >
                {/* Top Image & Badge Container */}
                <div>
                  <div className="relative h-48 bg-gray-200 border-b-2 border-[#3A4A3E] overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    
                    {/* Badge */}
                    {product.badge && (
                      <span className="absolute top-2 left-2 px-2.5 py-1 bg-[#15803D] text-[#F7F9F4] font-black text-[10px] uppercase border border-[#3A4A3E] tracking-wider shadow-sm">
                        {product.badge}
                      </span>
                    )}

                    {/* Category Label */}
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-[#14201A]/90 text-emerald-300 font-extrabold text-[10px] uppercase border border-[#3A4A3E]">
                      {product.categoryLabel}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    {/* Crop Target Pill */}
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#3F4C42]">
                      <span className="px-2 py-0.5 bg-[#E7ECE2] border border-[#3A4A3E] uppercase text-[#14201A]">
                        🎯 {product.cropTarget}
                      </span>
                      <div className="flex items-center gap-1 text-amber-600 font-extrabold">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                        <span>{product.rating}</span>
                        <span className="text-gray-400 font-normal">({product.soldCount})</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-display font-black text-base text-[#14201A] line-clamp-2 leading-tight uppercase group-hover:text-[#15803D] transition-colors">
                      {product.name}
                    </h3>

                    {/* AI Recommendation Quote */}
                    <div className="bg-[#E7ECE2] p-2.5 border-l-4 border-[#15803D] text-xs space-y-1">
                      <div className="flex items-center gap-1 font-bold text-[#15803D] uppercase text-[10px]">
                        <Sparkles className="w-3 h-3" /> Rekomendasi CahTani AI
                      </div>
                      <p className="text-[#14201A] font-medium text-[11px] leading-snug line-clamp-2">
                        &quot;{product.aiRecommendation}&quot;
                      </p>
                    </div>

                    {/* Price Range & Affiliate Indicator */}
                    <div className="pt-2 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">ESTIMASI HARGA:</p>
                        <p className="font-display font-black text-lg text-[#15803D]">
                          {product.priceRange}
                        </p>
                      </div>
                      <AdminGuard user={currentUser}>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditProduct(product);
                            }}
                            className="p-1.5 bg-amber-100 hover:bg-amber-300 text-amber-900 border border-amber-500 text-[10px] font-bold uppercase transition-colors cursor-pointer"
                            title="Edit Data Produk Ini"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingProduct(product);
                            }}
                            className="p-1.5 bg-red-100 hover:bg-red-300 text-red-900 border border-red-500 text-[10px] font-bold uppercase transition-colors cursor-pointer"
                            title="Hapus Produk Ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingAffiliateProduct(product);
                            }}
                            className="px-2 py-1 bg-[#E7ECE2] hover:bg-[#3A4A3E] hover:text-[#F7F9F4] text-[#14201A] border border-[#3A4A3E] text-[10px] font-bold uppercase transition-colors cursor-pointer flex items-center gap-1"
                            title="Atur/Edit Link Afiliasi Produk Ini"
                          >
                            <span>⚙️</span>
                            <span>Afiliasi</span>
                          </button>
                        </div>
                      </AdminGuard>
                    </div>

                    {/* Affiliate Links Indicator Pills */}
                    <div className="pt-1 flex items-center gap-1 text-[10px] font-black">
                      <span className="px-1.5 py-0.5 bg-[#EE4D2D]/10 text-[#EE4D2D] border border-[#EE4D2D]/30">
                        🛒 Shopee
                      </span>
                      <span className="px-1.5 py-0.5 bg-[#00AA5B]/10 text-[#00AA5B] border border-[#00AA5B]/30">
                        🟢 Tokopedia
                      </span>
                      <span className="px-1.5 py-0.5 bg-black/10 text-black border border-black/30">
                        🎵 TikTok
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Button */}
                <div className="p-4 pt-0">
                  <button
                    onClick={() => setSelectedProductForBuy(product)}
                    className="w-full py-3 bg-[#14201A] text-[#F7F9F4] font-black text-xs uppercase tracking-wider border-2 border-[#3A4A3E] hover:bg-[#15803D] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0px_0px_#3A4A3E]"
                  >
                    <ShoppingBag className="w-4 h-4 text-emerald-400" />
                    <span>BELI / LIHAT DI MARKETPLACE</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Marketplace Selection Modal */}
        <AnimatePresence>
          {selectedProductForBuy && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs cursor-pointer"
              onClick={() => setSelectedProductForBuy(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#F7F9F4] border-4 border-[#3A4A3E] max-w-lg w-full p-6 shadow-[10px_10px_0px_0px_#3A4A3E] relative space-y-5 text-[#14201A] cursor-default"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-start justify-between gap-3 border-b-2 border-[#3A4A3E] pb-3">
                  <div>
                    <span className="px-2 py-0.5 bg-[#15803D] text-[#F7F9F4] font-black text-[10px] uppercase tracking-wider">
                      PILIH MARKETPLACE PEMBELIAN
                    </span>
                    <h3 className="font-display font-black text-lg uppercase text-[#14201A] mt-1 leading-tight">
                      {selectedProductForBuy.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedProductForBuy(null)}
                    className="p-1 hover:bg-[#E7ECE2] text-[#14201A] transition-colors cursor-pointer"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Product Summary */}
                <div className="flex items-center gap-3 bg-[#E7ECE2] p-3 border-2 border-[#3A4A3E]">
                  <img
                    src={selectedProductForBuy.image}
                    alt={selectedProductForBuy.name}
                    className="w-16 h-16 object-cover border border-[#3A4A3E] shrink-0"
                  />
                  <div className="space-y-1">
                    <p className="font-display font-black text-base text-[#15803D]">
                      {selectedProductForBuy.priceRange}
                    </p>
                    <p className="text-xs text-[#3F4C42] font-medium">
                      🎯 Untuk: <strong>{selectedProductForBuy.cropTarget}</strong>
                    </p>
                  </div>
                </div>

                <p className="text-xs font-bold uppercase text-[#3F4C42] tracking-wider">
                  Klik aplikasi pilihan Anda untuk langsung diarahkan ke hasil pencarian produk terverifikasi:
                </p>

                {/* Marketplace Action Buttons */}
                <div className="space-y-3">
                  {/* Shopee Button */}
                  <button
                    onClick={() => openMarketplaceRedirect("SHOPEE", selectedProductForBuy)}
                    className="w-full py-3.5 px-4 bg-[#EE4D2D] text-white font-black text-sm uppercase tracking-wide border-2 border-[#3A4A3E] shadow-[4px_4px_0px_0px_#3A4A3E] hover:bg-[#d83f21] transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🛒</span>
                      <span>BELI DI SHOPEE INDONESIA</span>
                    </div>
                    <ExternalLink className="w-5 h-5" />
                  </button>

                  {/* Tokopedia Button */}
                  <button
                    onClick={() => openMarketplaceRedirect("TOKOPEDIA", selectedProductForBuy)}
                    className="w-full py-3.5 px-4 bg-[#00AA5B] text-white font-black text-sm uppercase tracking-wide border-2 border-[#3A4A3E] shadow-[4px_4px_0px_0px_#3A4A3E] hover:bg-[#00924e] transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🟢</span>
                      <span>BELI DI TOKOPEDIA</span>
                    </div>
                    <ExternalLink className="w-5 h-5" />
                  </button>

                  {/* TikTok Shop Button */}
                  <button
                    onClick={() => openMarketplaceRedirect("TIKTOK", selectedProductForBuy)}
                    className="w-full py-3.5 px-4 bg-[#14201A] text-white font-black text-sm uppercase tracking-wide border-2 border-[#3A4A3E] shadow-[4px_4px_0px_0px_#3A4A3E] hover:bg-[#25382b] transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎵</span>
                      <span>BELI DI TIKTOK SHOP</span>
                    </div>
                    <ExternalLink className="w-5 h-5" />
                  </button>
                </div>

                {/* Copy Keyword Fallback Helper */}
                <div className="pt-3 border-t border-[#3A4A3E]/30 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#3F4C42]">
                    <span>KATA KUNCI PENCARIAN TERPRESISI:</span>
                    <button
                      onClick={() => handleCopyKeyword(selectedProductForBuy.shopeeSearchKeyword)}
                      className="text-[#15803D] hover:underline flex items-center gap-1 cursor-pointer font-black"
                    >
                      {copiedKeyword ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Kata Kunci</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-2 bg-[#E7ECE2] text-xs font-mono font-bold text-[#14201A] border border-[#3A4A3E] select-all">
                    {selectedProductForBuy.shopeeSearchKeyword}
                  </div>
                </div>

                {/* Footer Disclaimer */}
                <p className="text-[11px] text-[#3F4C42] font-medium text-center">
                  💡 <em>CahTani AI menyediakan rekomendasi racikan & alat tani presisi. Pembayaran & pengiriman ditangani penuh oleh marketplace pilihan Anda.</em>
                </p>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Single Product Affiliate Link Editor Modal */}
        <AdminGuard user={currentUser}>
          <AnimatePresence>
            {editingAffiliateProduct && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs cursor-pointer"
                onClick={() => setEditingAffiliateProduct(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[#F7F9F4] border-4 border-[#3A4A3E] max-w-lg w-full p-6 shadow-[10px_10px_0px_0px_#3A4A3E] relative space-y-4 text-[#14201A] max-h-[90vh] overflow-y-auto cursor-default"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between border-b-2 border-[#3A4A3E] pb-3">
                    <div>
                      <span className="px-2 py-0.5 bg-[#15803D] text-white font-black text-[10px] uppercase">
                        PENGATURAN LINK AFILIASI PRODUK
                      </span>
                      <h3 className="font-display font-black text-lg uppercase text-[#14201A] mt-1 leading-tight">
                        {editingAffiliateProduct.name}
                      </h3>
                    </div>
                    <button
                      onClick={() => setEditingAffiliateProduct(null)}
                      className="p-1 hover:bg-[#E7ECE2] text-[#14201A] transition-colors cursor-pointer"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="p-3 bg-[#E7ECE2] border border-[#3A4A3E] text-xs font-medium space-y-1">
                    <p className="font-bold text-[#15803D]">💡 KUSTOMISASI LINK AFILIASI ANDA</p>
                    <p className="text-[#3F4C42]">
                      Masukkan link pendek/khusus dari akun Shopee Affiliate, Tokopedia Affiliate, atau TikTok Shop milik Anda (contoh: <code>https://s.shopee.co.id/xxx</code>). Jika dikosongkan, sistem akan otomatis menggunakan pencarian default.
                    </p>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const shopee = (form.elements.namedItem("shopeeUrl") as HTMLInputElement).value;
                      const tokopedia = (form.elements.namedItem("tokopediaUrl") as HTMLInputElement).value;
                      const tiktok = (form.elements.namedItem("tiktokUrl") as HTMLInputElement).value;
                      handleSaveAffiliateConfig(editingAffiliateProduct.id, shopee, tokopedia, tiktok);
                    }}
                    className="space-y-4 pt-2"
                  >
                    <div className="space-y-1">
                      <label className="block text-xs font-black uppercase text-[#EE4D2D] flex items-center gap-1">
                        🛒 LINK AFILIASI SHOPEE:
                      </label>
                      <input
                        type="url"
                        name="shopeeUrl"
                        defaultValue={customAffiliates[editingAffiliateProduct.id]?.shopee || editingAffiliateProduct.shopeeAffiliateUrl || ""}
                        placeholder="https://s.shopee.co.id/..."
                        className="w-full p-2.5 bg-[#F7F9F4] border-2 border-[#3A4A3E] font-mono text-xs text-[#14201A] focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-black uppercase text-[#00AA5B] flex items-center gap-1">
                        🟢 LINK AFILIASI TOKOPEDIA:
                      </label>
                      <input
                        type="url"
                        name="tokopediaUrl"
                        defaultValue={customAffiliates[editingAffiliateProduct.id]?.tokopedia || editingAffiliateProduct.tokopediaAffiliateUrl || ""}
                        placeholder="https://tokopedia.link/..."
                        className="w-full p-2.5 bg-[#F7F9F4] border-2 border-[#3A4A3E] font-mono text-xs text-[#14201A] focus:outline-none focus:ring-2 focus:ring-[#00AA5B]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-black uppercase text-black flex items-center gap-1">
                        🎵 LINK AFILIASI TIKTOK SHOP:
                      </label>
                      <input
                        type="url"
                        name="tiktokUrl"
                        defaultValue={customAffiliates[editingAffiliateProduct.id]?.tiktok || editingAffiliateProduct.tiktokAffiliateUrl || ""}
                        placeholder="https://vt.tiktok.com/..."
                        className="w-full p-2.5 bg-[#F7F9F4] border-2 border-[#3A4A3E] font-mono text-xs text-[#14201A] focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>

                    <div className="pt-3 flex items-center justify-end gap-2 border-t-2 border-[#3A4A3E]">
                      <button
                        type="button"
                        onClick={() => setEditingAffiliateProduct(null)}
                        className="px-4 py-2 bg-[#E7ECE2] text-[#14201A] font-bold text-xs uppercase border-2 border-[#3A4A3E] hover:bg-gray-300 transition-colors cursor-pointer"
                      >
                        BATAL
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-[#15803D] text-[#F7F9F4] font-black text-xs uppercase tracking-wider border-2 border-[#3A4A3E] hover:bg-[#14201A] transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-4 h-4" />
                        <span>SIMPAN LINK AFILIASI</span>
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </AdminGuard>

        {/* Global Affiliate Settings Modal */}
        <AdminGuard user={currentUser}>
          <AnimatePresence>
            {isAffiliateModalOpen && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs cursor-pointer"
                onClick={() => setIsAffiliateModalOpen(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[#F7F9F4] border-4 border-[#3A4A3E] max-w-2xl w-full p-6 shadow-[10px_10px_0px_0px_#3A4A3E] relative space-y-5 text-[#14201A] max-h-[90vh] overflow-y-auto cursor-default"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between border-b-2 border-[#3A4A3E] pb-3">
                    <div>
                      <span className="px-2 py-0.5 bg-[#15803D] text-white font-black text-[10px] uppercase tracking-wider">
                        SISTEM REKOMENDASI AFILIASI TANI
                      </span>
                      <h3 className="font-display font-black text-xl uppercase text-[#14201A] mt-1">
                        ⚙️ PENGATURAN LINK AFILIASI SAYA
                      </h3>
                    </div>
                    <button
                      onClick={() => setIsAffiliateModalOpen(false)}
                      className="p-1 hover:bg-[#E7ECE2] text-[#14201A] transition-colors cursor-pointer"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="p-3 bg-[#E7ECE2] border border-[#3A4A3E] text-xs font-medium space-y-1">
                    <p className="font-bold text-[#15803D]">🛒 PENGATURAN KODE AFILIASI GLOBAL</p>
                    <p className="text-[#3F4C42]">
                      Masukkan ID/Tag Afiliasi global Anda di bawah ini agar setiap link pencarian otomatis menyertakan komisi afiliasi Anda saat pembeli mengklik produk:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-black uppercase text-[#EE4D2D]">
                        SHOPEE AF_SITEID / TAG:
                      </label>
                      <input
                        type="text"
                        value={globalShopeeTag}
                        onChange={(e) => setGlobalShopeeTag(e.target.value)}
                        placeholder="e.g. cahtani_affiliate"
                        className="w-full p-2 bg-[#F7F9F4] border-2 border-[#3A4A3E] font-mono text-xs text-[#14201A]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-black uppercase text-[#00AA5B]">
                        TOKOPEDIA AFF_ID / TAG:
                      </label>
                      <input
                        type="text"
                        value={globalTokopediaTag}
                        onChange={(e) => setGlobalTokopediaTag(e.target.value)}
                        placeholder="e.g. cahtani_affiliate"
                        className="w-full p-2 bg-[#F7F9F4] border-2 border-[#3A4A3E] font-mono text-xs text-[#14201A]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-black uppercase text-black">
                        TIKTOK SHOP TAG:
                      </label>
                      <input
                        type="text"
                        value={globalTiktokTag}
                        onChange={(e) => setGlobalTiktokTag(e.target.value)}
                        placeholder="e.g. cahtani_tiktok"
                        className="w-full p-2 bg-[#F7F9F4] border-2 border-[#3A4A3E] font-mono text-xs text-[#14201A]"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t-2 border-[#3A4A3E]/30 space-y-3">
                    <h4 className="font-black text-xs uppercase tracking-wider text-[#14201A]">
                      📋 ATUR LINK KHUSUS UNTUK MASING-MASING PRODUK ({productsList.length} PRODUK KATALOG):
                    </h4>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {productsList.map((prod) => {
                        const hasCustom = customAffiliates[prod.id];
                        return (
                          <div
                            key={prod.id}
                            className="flex items-center justify-between p-2.5 bg-[#E7ECE2] border border-[#3A4A3E] text-xs"
                          >
                            <div className="flex items-center gap-2 max-w-sm truncate">
                              <img src={prod.image} alt={prod.name} className="w-8 h-8 object-cover border border-[#3A4A3E]" />
                              <span className="font-bold truncate text-[#14201A]">{prod.name}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {hasCustom ? (
                                <span className="px-2 py-0.5 bg-[#15803D] text-[#F7F9F4] font-black text-[10px] uppercase">
                                  ✓ Kustom
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-gray-300 text-gray-700 font-bold text-[10px] uppercase">
                                  Default
                                </span>
                              )}
                              <button
                                onClick={() => {
                                  setIsAffiliateModalOpen(false);
                                  setEditingAffiliateProduct(prod);
                                }}
                                className="px-2.5 py-1 bg-[#14201A] text-[#F7F9F4] font-bold text-[10px] uppercase hover:bg-[#15803D] transition-colors cursor-pointer"
                              >
                                Edit Link
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-2 border-t-2 border-[#3A4A3E]">
                    <button
                      onClick={() => {
                        try {
                          localStorage.setItem("cahtani_global_shopee_tag", globalShopeeTag);
                          localStorage.setItem("cahtani_global_tokopedia_tag", globalTokopediaTag);
                          localStorage.setItem("cahtani_global_tiktok_tag", globalTiktokTag);
                        } catch (e) {
                          console.error(e);
                        }
                        setIsAffiliateModalOpen(false);
                      }}
                      className="px-6 py-2.5 bg-[#15803D] text-[#F7F9F4] font-black text-xs uppercase tracking-wider border-2 border-[#3A4A3E] hover:bg-[#14201A] transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-4 h-4" />
                      <span>SIMPAN PENGATURAN AFILIASI</span>
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </AdminGuard>

        {/* Product CRUD (Add / Edit) Modal for Admin */}
        <AdminGuard user={currentUser}>
          <AnimatePresence>
            {isProductCrudModalOpen && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs cursor-pointer"
                onClick={() => setIsProductCrudModalOpen(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[#F7F9F4] border-4 border-[#3A4A3E] max-w-2xl w-full p-6 shadow-[10px_10px_0px_0px_#3A4A3E] relative space-y-4 text-[#14201A] max-h-[90vh] overflow-y-auto cursor-default"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between border-b-2 border-[#3A4A3E] pb-3">
                    <div>
                      <span className="px-2 py-0.5 bg-amber-400 text-black font-black text-[10px] uppercase tracking-wider border border-amber-600">
                        ADMIN KHUSUS • PRODUK KATALOG
                      </span>
                      <h3 className="font-display font-black text-xl uppercase text-[#14201A] mt-1">
                        {editingProduct ? "✏️ EDIT DATA PRODUK" : "➕ TAMBAH PRODUK BARU"}
                      </h3>
                    </div>
                    <button
                      onClick={() => setIsProductCrudModalOpen(false)}
                      className="p-1 hover:bg-[#E7ECE2] text-[#14201A] transition-colors cursor-pointer"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveProductSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Nama Produk */}
                      <div className="space-y-1">
                        <label className="block text-xs font-black uppercase text-[#14201A]">
                          NAMA PRODUK <span className="text-red-600">*</span>:
                        </label>
                        <input
                          type="text"
                          required
                          value={productFormData.name || ""}
                          onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                          placeholder="Contoh: Pupuk NPK Mutiara 16-16-16 High Pure"
                          className="w-full p-2.5 bg-[#F7F9F4] border-2 border-[#3A4A3E] font-medium text-xs text-[#14201A] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                        />
                      </div>

                      {/* Kategori */}
                      <div className="space-y-1">
                        <label className="block text-xs font-black uppercase text-[#14201A]">
                          KATEGORI <span className="text-red-600">*</span>:
                        </label>
                        <select
                          value={productFormData.category || "PUPUK"}
                          onChange={(e) => setProductFormData({ ...productFormData, category: e.target.value as any })}
                          className="w-full p-2.5 bg-[#F7F9F4] border-2 border-[#3A4A3E] font-medium text-xs text-[#14201A] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                        >
                          {categoriesList.filter((c) => c.id !== "ALL").map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.icon} {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Estimasi Harga */}
                      <div className="space-y-1">
                        <label className="block text-xs font-black uppercase text-[#14201A]">
                          RENTANG HARGA ESTIMASI:
                        </label>
                        <input
                          type="text"
                          value={productFormData.priceRange || ""}
                          onChange={(e) => setProductFormData({ ...productFormData, priceRange: e.target.value })}
                          placeholder="Contoh: Rp 45.000 - Rp 80.000"
                          className="w-full p-2.5 bg-[#F7F9F4] border-2 border-[#3A4A3E] font-medium text-xs text-[#14201A] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                        />
                      </div>

                      {/* Target Tanaman */}
                      <div className="space-y-1">
                        <label className="block text-xs font-black uppercase text-[#14201A]">
                          TARGET TANAMAN:
                        </label>
                        <input
                          type="text"
                          value={productFormData.cropTarget || ""}
                          onChange={(e) => setProductFormData({ ...productFormData, cropTarget: e.target.value })}
                          placeholder="Contoh: Padi, Cabai, Jagung, Bawang"
                          className="w-full p-2.5 bg-[#F7F9F4] border-2 border-[#3A4A3E] font-medium text-xs text-[#14201A] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                        />
                      </div>

                      {/* Image URL */}
                      <div className="space-y-1 md:col-span-2">
                        <label className="block text-xs font-black uppercase text-[#14201A]">
                          URL GAMBAR PRODUK (HTTPS):
                        </label>
                        <input
                          type="url"
                          value={productFormData.image || ""}
                          onChange={(e) => setProductFormData({ ...productFormData, image: e.target.value })}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full p-2.5 bg-[#F7F9F4] border-2 border-[#3A4A3E] font-mono text-xs text-[#14201A] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                        />
                      </div>

                      {/* AI Recommendation Quote */}
                      <div className="space-y-1 md:col-span-2">
                        <label className="block text-xs font-black uppercase text-[#15803D]">
                          💡 CATATAN REKOMENDASI CAHTANI AI:
                        </label>
                        <textarea
                          rows={2}
                          value={productFormData.aiRecommendation || ""}
                          onChange={(e) => setProductFormData({ ...productFormData, aiRecommendation: e.target.value })}
                          placeholder="Saran pemakaian dari pakar AI..."
                          className="w-full p-2.5 bg-[#F7F9F4] border-2 border-[#3A4A3E] font-medium text-xs text-[#14201A] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                        />
                      </div>

                      {/* Description */}
                      <div className="space-y-1 md:col-span-2">
                        <label className="block text-xs font-black uppercase text-[#14201A]">
                          DESKRIPSI LENGKAP & MANFAAT:
                        </label>
                        <textarea
                          rows={3}
                          value={productFormData.description || ""}
                          onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                          placeholder="Uraian manfaat, kandungan aktif, dan spesifikasi..."
                          className="w-full p-2.5 bg-[#F7F9F4] border-2 border-[#3A4A3E] font-medium text-xs text-[#14201A] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                        />
                      </div>

                      {/* Dosis / Petunjuk */}
                      <div className="space-y-1 md:col-span-2">
                        <label className="block text-xs font-black uppercase text-[#14201A]">
                          DOSIS & APLIKASI:
                        </label>
                        <input
                          type="text"
                          value={productFormData.dosage || ""}
                          onChange={(e) => setProductFormData({ ...productFormData, dosage: e.target.value })}
                          placeholder="Contoh: 2-3 gram per liter air disemprotkan tiap 7 hari."
                          className="w-full p-2.5 bg-[#F7F9F4] border-2 border-[#3A4A3E] font-medium text-xs text-[#14201A] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                        />
                      </div>

                      {/* Direct Affiliate URLs */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-black uppercase text-[#EE4D2D]">
                          🛒 SHOPEE DIRECT AFFILIATE LINK:
                        </label>
                        <input
                          type="url"
                          value={productFormData.shopeeAffiliateUrl || ""}
                          onChange={(e) => setProductFormData({ ...productFormData, shopeeAffiliateUrl: e.target.value })}
                          placeholder="https://s.shopee.co.id/..."
                          className="w-full p-2 bg-[#F7F9F4] border-2 border-[#3A4A3E] font-mono text-xs text-[#14201A]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-black uppercase text-[#00AA5B]">
                          🟢 TOKOPEDIA DIRECT AFFILIATE LINK:
                        </label>
                        <input
                          type="url"
                          value={productFormData.tokopediaAffiliateUrl || ""}
                          onChange={(e) => setProductFormData({ ...productFormData, tokopediaAffiliateUrl: e.target.value })}
                          placeholder="https://tokopedia.link/..."
                          className="w-full p-2 bg-[#F7F9F4] border-2 border-[#3A4A3E] font-mono text-xs text-[#14201A]"
                        />
                      </div>
                    </div>

                    <div className="pt-3 flex items-center justify-end gap-2 border-t-2 border-[#3A4A3E]">
                      <button
                        type="button"
                        onClick={() => setIsProductCrudModalOpen(false)}
                        className="px-4 py-2 bg-[#E7ECE2] text-[#14201A] font-bold text-xs uppercase border-2 border-[#3A4A3E] hover:bg-gray-300 transition-colors cursor-pointer"
                      >
                        BATAL
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-[#15803D] text-[#F7F9F4] font-black text-xs uppercase tracking-wider border-2 border-[#3A4A3E] hover:bg-[#14201A] transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>{editingProduct ? "SIMPAN PERUBAHAN" : "PUBLIKASIKAN PRODUK BARU"}</span>
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </AdminGuard>

        {/* Delete Confirmation Modal for Admin */}
        <AdminGuard user={currentUser}>
          <AnimatePresence>
            {deletingProduct && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs cursor-pointer"
                onClick={() => setDeletingProduct(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[#F7F9F4] border-4 border-[#3A4A3E] max-w-md w-full p-6 shadow-[10px_10px_0px_0px_#3A4A3E] relative space-y-4 text-[#14201A] cursor-default"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-3 text-red-700">
                    <div className="p-2 bg-red-100 border border-red-500 rounded-none">
                      <Trash2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-display font-black text-lg uppercase leading-tight">
                        KONFIRMASI HAPUS PRODUK
                      </h3>
                      <p className="text-xs text-red-600 font-bold uppercase">AKSI INI TIDAK DAPAT DIBATALKAN</p>
                    </div>
                  </div>

                  <p className="text-xs font-medium text-[#3F4C42]">
                    Apakah Anda yakin ingin menghapus produk <strong>&quot;{deletingProduct.name}&quot;</strong> dari katalog rekomendasi CahTani?
                  </p>

                  <div className="pt-3 flex items-center justify-end gap-2 border-t-2 border-[#3A4A3E]">
                    <button
                      onClick={() => setDeletingProduct(null)}
                      className="px-4 py-2 bg-[#E7ECE2] text-[#14201A] font-bold text-xs uppercase border-2 border-[#3A4A3E] hover:bg-gray-300 transition-colors cursor-pointer"
                    >
                      BATAL
                    </button>
                    <button
                      onClick={handleDeleteProductConfirm}
                      className="px-5 py-2 bg-red-700 text-white font-black text-xs uppercase tracking-wider border-2 border-[#3A4A3E] hover:bg-red-900 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>HAPUS PERMANEN</span>
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </AdminGuard>
      </main>

      {/* Footer */}
      <FooterSection />

      <FixedBottomNav onOpenChat={onOpenChat} />
    </div>
  );
};
