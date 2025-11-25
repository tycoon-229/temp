"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useModal } from "@/context/ModalContext";
import { X } from "lucide-react";

const AuthModal = () => {
  const { isOpen, closeModal, view } = useModal();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); 
  
  const [adminCode, setAdminCode] = useState(""); 
  const [variant, setVariant] = useState("login"); 
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const SECRET_ADMIN_CODE = "admin123";

  // Biến kiểm tra xem mật khẩu có khớp không (Chỉ kiểm tra khi đã bắt đầu nhập xác nhận)
  const isPasswordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  useEffect(() => {
    const checkSession = async () => {
      if (isOpen) {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setMessage({ type: 'error', text: 'Bạn đang đăng nhập rồi! Vui lòng đăng xuất trước.' });
          setTimeout(() => {
             closeModal();
             window.location.reload(); 
          }, 1500);
          return;
        }

        setVariant(view);
        setEmail("");
        setPassword("");
        setConfirmPassword(""); 
        setAdminCode("");
        setMessage(null);
      }
    };

    checkSession();
  }, [isOpen, view, closeModal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (variant === 'register') {
        // --- LOGIC ĐĂNG KÝ ---
        
        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp!' });
            setLoading(false);
            return; 
        }

        let userRole = 'user'; 
        if (adminCode === SECRET_ADMIN_CODE) {
            userRole = 'admin';
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            data: { 
                full_name: 'User',
                role: userRole 
            } 
          }
        });

        if (error) throw error;
        
        if (userRole === 'admin') {
            setMessage({ type: 'success', text: 'Đăng ký ADMIN thành công! Hãy kiểm tra email.' });
        } else {
            setMessage({ type: 'success', text: 'Đăng ký thành công! Hãy kiểm tra email.' });
        }
      } 
      else if (variant === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        
        setMessage({ type: 'success', text: 'Đăng nhập thành công!' });
        setTimeout(() => {
            closeModal();
            window.location.reload(); 
        }, 1000);
      }
      else if (variant === 'recovery') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/update-password`,
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Email khôi phục đã được gửi!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/90 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-neutral-800 border border-neutral-700 w-full max-w-md rounded-lg p-6 relative shadow-xl">
        
        <button onClick={closeModal} className="absolute top-4 right-4 text-neutral-400 hover:text-white transition">
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-center mb-2 text-white">
          {variant === 'login' && 'Đăng nhập'}
          {variant === 'register' && 'Đăng ký'}
          {variant === 'recovery' && 'Khôi phục mật khẩu'}
        </h2>
        
        <p className="text-center text-neutral-400 mb-6 text-sm">
          {variant === 'recovery' 
            ? 'Nhập email để nhận hướng dẫn lấy lại mật khẩu' 
            : 'Chào mừng đến với Music App'}
        </p>

        {message && (
          <div className={`p-3 rounded mb-4 text-sm text-center ${message.type === 'error' ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
            className="bg-neutral-700 p-3 rounded text-white outline-none focus:ring-2 focus:ring-green-500 transition border border-transparent"
          />
          
          {variant !== 'recovery' && (
            <input
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              className="bg-neutral-700 p-3 rounded text-white outline-none focus:ring-2 focus:ring-green-500 transition border border-transparent"
            />
          )}

          {/* Ô Xác nhận mật khẩu: Tô đỏ nếu không khớp */}
          {variant === 'register' && (
            <input
              type="password"
              placeholder="Xác nhận mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
              className={`bg-neutral-700 p-3 rounded text-white outline-none transition border 
                ${isPasswordMismatch 
                  ? 'border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500' // Style khi KHÔNG khớp
                  : 'border-transparent focus:ring-2 focus:ring-green-500' // Style khi khớp hoặc chưa nhập
                }`}
            />
          )}

          {variant === 'register' && (
             <input
                type="text"
                placeholder="Mã giới thiệu Admin (Tùy chọn)"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                disabled={loading}
                className="bg-neutral-700 p-3 rounded text-white outline-none focus:ring-2 focus:ring-blue-500 transition border border-neutral-600"
             />
          )}
          
          <button 
            type="submit" 
            disabled={loading}
            className="bg-green-500 text-black font-bold py-3 rounded-full hover:opacity-80 disabled:opacity-50 transition mt-2"
          >
            {loading ? 'Đang xử lý...' : (
              variant === 'login' ? 'Đăng nhập' : 
              variant === 'register' ? 'Đăng ký' : 'Gửi email'
            )}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-neutral-400 flex flex-col gap-y-2">
          {variant === 'login' ? (
            <>
              <div>
                Chưa có tài khoản? <span onClick={() => {setVariant('register'); setMessage(null)}} className="text-white font-bold cursor-pointer hover:underline">Đăng ký ngay</span>
              </div>
              <div onClick={() => {setVariant('recovery'); setMessage(null)}} className="text-neutral-400 text-xs cursor-pointer hover:text-white hover:underline">
                Quên mật khẩu?
              </div>
            </>
          ) : (
            <div>
              {variant === 'register' 
                ? <>Đã có tài khoản? <span onClick={() => {setVariant('login'); setMessage(null)}} className="text-white font-bold cursor-pointer hover:underline">Đăng nhập</span></>
                : <span onClick={() => {setVariant('login'); setMessage(null)}} className="text-white font-bold cursor-pointer hover:underline">Quay lại đăng nhập</span>
              }
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AuthModal;