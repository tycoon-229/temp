"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Header from "@/components/Header";
import { User, Camera, Loader2, Pencil, X, Save } from "lucide-react";

const Account = () => {
  const router = useRouter();
  
  // --- STATES ---
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Trạng thái: Đang xem hay Đang sửa
  const [message, setMessage] = useState(null);

  // Dữ liệu Profile
  const [user, setUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  // Biến backup để nếu bấm "Hủy" thì quay về dữ liệu cũ
  const [originalData, setOriginalData] = useState({}); 

  // Ref cho input file (để bấm vào avatar thì kích hoạt chọn ảnh)
  const fileInputRef = useRef(null);

  // 1. TẢI DỮ LIỆU
  useEffect(() => {
    const getProfile = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.push("/");
          return;
        }

        setUser(session.user);

        // Lấy thông tin từ bảng profiles
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, phone')
          .eq('id', session.user.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          setFullName(data.full_name || "");
          setAvatarUrl(data.avatar_url || "");
          setPhone(data.phone || "");
          
          // Lưu bản sao lưu để dùng khi Hủy bỏ
          setOriginalData({
            fullName: data.full_name || "",
            phone: data.phone || "",
            avatarUrl: data.avatar_url || ""
          });
        }
      } catch (error) {
        console.log("Lỗi tải profile:", error);
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, [router]);

  // 2. XỬ LÝ UPLOAD ẢNH
  const handleUploadAvatar = async (event) => {
    try {
      setMessage(null);
      const file = event.target.files[0];
      if (!file) return;

      // Tạo tên file duy nhất: avatar-IDUser-Time.png
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload lên Bucket 'images'
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Lấy đường dẫn công khai (Public URL)
      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      
      // Cập nhật giao diện ngay lập tức
      setAvatarUrl(data.publicUrl);

    } catch (error) {
      setMessage({ type: 'error', text: 'Lỗi upload ảnh: ' + error.message });
    }
  };

  // 3. XỬ LÝ LƯU THÔNG TIN
  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          full_name: fullName,
          phone: phone,         // Lưu số điện thoại
          avatar_url: avatarUrl, // Lưu link ảnh mới
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Cập nhật thành công!' });
      
      // Cập nhật lại bản backup
      setOriginalData({ fullName, phone, avatarUrl });
      setIsEditing(false); // Tắt chế độ sửa
      
      // --- QUAN TRỌNG: Phát tín hiệu cập nhật cho Header biết ---
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event("profile-updated"));
      }
      // ---------------------------------------------------------
      
      // Tự tắt thông báo
      setTimeout(() => setMessage(null), 3000);
      router.refresh(); // Reload nhẹ để cập nhật avatar trên Header

    } catch (error) {
      setMessage({ type: 'error', text: 'Lỗi: ' + error.message });
    } finally {
      setSaving(false);
    }
  };

  // 4. XỬ LÝ HỦY BỎ
  const handleCancel = () => {
    setFullName(originalData.fullName);
    setPhone(originalData.phone);
    setAvatarUrl(originalData.avatarUrl);
    setIsEditing(false);
    setMessage(null);
  };

  return (
    <div className="bg-neutral-900 rounded-lg h-full w-full overflow-hidden overflow-y-auto">
      <Header className="from-bg-neutral-900">
        <div className="mb-2 flex flex-col gap-y-6">
          <h1 className="text-white text-3xl font-semibold text-center mt-6">
            Hồ sơ cá nhân
          </h1>
        </div>
      </Header>

      <div className="flex justify-center px-6 pb-20">
        {loading ? (
          <div className="flex items-center gap-x-2 text-neutral-400 mt-10">
            <Loader2 className="animate-spin" /> Đang tải thông tin...
          </div>
        ) : (
          <div className="relative w-full max-w-xl bg-neutral-800/50 rounded-lg p-8 border border-neutral-700 flex flex-col items-center gap-y-6">
            
            {/* --- NÚT CHỈNH SỬA (Góc phải) --- */}
            <div className="absolute top-4 right-4">
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="text-neutral-400 hover:text-white transition p-2 bg-neutral-700/50 rounded-full"
                  title="Chỉnh sửa thông tin"
                >
                  <Pencil size={20} />
                </button>
              ) : (
                <button 
                  onClick={handleCancel}
                  className="text-neutral-400 hover:text-red-500 transition p-2 bg-neutral-700/50 rounded-full"
                  title="Hủy bỏ"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {/* --- THÔNG BÁO --- */}
            {message && (
              <div className={`w-full p-3 rounded-md text-center text-sm font-medium mb-2 ${
                message.type === 'success' 
                  ? 'bg-green-500/20 text-green-500 border border-green-500/50' 
                  : 'bg-red-500/20 text-red-500 border border-red-500/50'
              }`}>
                {message.text}
              </div>
            )}

            {/* --- AVATAR --- */}
            <div className="relative group">
              <div className={`h-32 w-32 rounded-full bg-neutral-700 border-4 ${isEditing ? 'border-green-500 cursor-pointer' : 'border-neutral-900'} overflow-hidden flex items-center justify-center relative`}
                   onClick={() => isEditing && fileInputRef.current.click()} // Chỉ click được khi đang sửa
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="object-cover w-full h-full" />
                ) : (
                  <User size={60} className="text-neutral-400" />
                )}
                
                {/* Lớp phủ khi đang ở chế độ sửa */}
                {isEditing && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Camera className="text-white opacity-80" size={30} />
                  </div>
                )}
              </div>
              {/* Input file ẩn */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleUploadAvatar} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            
            {/* Text hướng dẫn nhỏ */}
            {isEditing && <p className="text-xs text-neutral-500 -mt-4">Nhấn vào ảnh để thay đổi</p>}

            {/* --- FORM --- */}
            <div className="w-full flex flex-col gap-y-4">
              
              {/* Email (Luôn Read-only) */}
              <div className="flex flex-col gap-y-2">
                <label className="text-sm font-medium text-neutral-400">Email</label>
                <input 
                  disabled 
                  value={user?.email || ""} 
                  className="bg-neutral-900 text-neutral-500 cursor-not-allowed px-4 py-3 rounded-md border border-transparent outline-none"
                />
              </div>

              {/* Họ tên */}
              <div className="flex flex-col gap-y-2">
                <label className={`text-sm font-medium ${isEditing ? 'text-white' : 'text-neutral-400'}`}>Họ và tên hiển thị</label>
                <input 
                  disabled={!isEditing} // Khóa nếu không phải chế độ sửa
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Chưa cập nhật tên" 
                  className={`px-4 py-3 rounded-md outline-none transition ${
                    isEditing 
                      ? 'bg-neutral-700 text-white border border-neutral-600 focus:border-green-500' 
                      : 'bg-transparent text-neutral-300 border border-transparent'
                  }`}
                />
              </div>

              {/* Số điện thoại */}
              <div className="flex flex-col gap-y-2">
                <label className={`text-sm font-medium ${isEditing ? 'text-white' : 'text-neutral-400'}`}>Số điện thoại</label>
                <input 
                  disabled={!isEditing} // Khóa nếu không phải chế độ sửa
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Chưa cập nhật số điện thoại" 
                  className={`px-4 py-3 rounded-md outline-none transition ${
                    isEditing 
                      ? 'bg-neutral-700 text-white border border-neutral-600 focus:border-green-500' 
                      : 'bg-transparent text-neutral-300 border border-transparent'
                  }`}
                />
              </div>

              {/* Nút Lưu (Chỉ hiện khi đang Sửa) */}
              {isEditing && (
                <div className="flex gap-x-4 mt-4">
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 bg-green-500 text-black font-bold py-3 rounded-full hover:opacity-80 disabled:opacity-50 transition flex items-center justify-center gap-x-2"
                    >
                        {saving ? <Loader2 className="animate-spin"/> : <Save size={20}/>}
                        Lưu thay đổi
                    </button>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Account;