import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useUiStore from '../store/uiStore';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import './RegisterPage.css';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuthStore();
  const { addToast } = useUiStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !username || !password || !confirmPassword) return;

    if (password !== confirmPassword) {
      addToast({
        type: 'error',
        title: 'Şifre Uyuşmazlığı',
        message: 'Girdiğiniz şifreler eşleşmiyor.',
      });
      return;
    }

    setIsSubmitting(true);
    const result = await register({
      email,
      username,
      password,
      full_name: fullName || null,
    });
    setIsSubmitting(false);

    if (result.success) {
      addToast({
        type: 'success',
        title: 'Kayıt Başarılı',
        message: 'Hesabınız oluşturuldu. Hoş geldiniz!',
      });
      navigate('/dashboard');
    } else {
      addToast({
        type: 'error',
        title: 'Kayıt Başarısız',
        message: result.error || 'Kayıt olurken bir hata oluştu.',
      });
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card glassmorphism">
        <div className="auth-header">
          <h2 className="auth-logo">YatırımZekası</h2>
          <p className="auth-subtitle">Yeni hesap oluşturarak hemen başlayın</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            label="Ad Soyad"
            type="text"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <Input
            label="Kullanıcı Adı"
            type="text"
            placeholder="johndoe"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <Input
            label="E-posta Adresi"
            type="email"
            placeholder="örnek@mail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Şifre"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Input
            label="Şifre Tekrar"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <Button type="submit" variant="primary" loading={isSubmitting} fullWidth>
            Kayıt Ol ve Giriş Yap
          </Button>
        </form>

        <div className="auth-footer">
          <span>Zaten hesabınız var mı?</span>
          <Link to="/login" className="auth-link">Giriş Yapın</Link>
        </div>
      </div>
    </div>
  );
}
