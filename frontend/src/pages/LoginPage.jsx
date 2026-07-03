import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useUiStore from '../store/uiStore';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import './LoginPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuthStore();
  const { addToast } = useUiStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success) {
      addToast({
        type: 'success',
        title: 'Başarılı Giriş',
        message: 'Hoş geldiniz!',
      });
      navigate('/dashboard');
    } else {
      addToast({
        type: 'error',
        title: 'Giriş Başarısız',
        message: result.error || 'E-posta veya şifre hatalı.',
      });
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card glassmorphism">
        <div className="auth-header">
          <h2 className="auth-logo">YatırımZekası</h2>
          <p className="auth-subtitle">AI Destekli Portföy Takip Sistemi</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            label="E-posta Adresi"
            type="email"
            placeholder="örnek@mail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <Input
            label="Şifre"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <Button type="submit" variant="primary" loading={isSubmitting} fullWidth>
            Giriş Yap
          </Button>
        </form>

        <div className="auth-footer">
          <span>Hesabınız yok mu?</span>
          <Link to="/register" className="auth-link">Kayıt Olun</Link>
        </div>
      </div>
    </div>
  );
}
