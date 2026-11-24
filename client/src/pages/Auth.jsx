import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Logo } from '../components/Icons';
import { useAuth } from '../context/AppContext';

function AuthShell({ title, subtitle, children }) {
  return (
    <div className="bg-gradient-to-br from-rose-100 via-rose-50 to-beige py-12 sm:py-16">
      <div className="container-bdo">
        <div className="card mx-auto max-w-md p-6 sm:p-8">
          <div className="text-center"><Logo /></div>
          <h1 className="mt-6 text-center font-serif text-2xl font-bold text-choco-800">{title}</h1>
          <p className="mt-1 text-center text-sm text-stone-600">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

function PasswordInput({ id, value, onChange, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input id={id} name={id} type={show ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} className="input !pr-11" />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-stone-500" aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function Login() {
  const { login, user } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const from = location.state?.from || '/compte';

  if (user) return <Navigate to={user.role !== 'customer' && !location.state?.from ? '/admin' : from} replace />;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return setError('Renseignez votre email et votre mot de passe.');
    setBusy(true); setError('');
    try {
      await login(form.email, form.password); // la redirection est gérée par le rendu ci-dessus
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <AuthShell title="Connexion" subtitle="Accédez à votre compte Beauté d’Or">
      <form onSubmit={submit} noValidate className="space-y-4">
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" placeholder="vous@exemple.sn" />
        </div>
        <div>
          <label htmlFor="password" className="label">Mot de passe</label>
          <PasswordInput id="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
        <button disabled={busy} className="btn-primary w-full !py-3">{busy ? 'Connexion…' : 'Se connecter'}</button>
      </form>
      <p className="mt-6 text-center text-sm">
        Pas encore de compte ? <Link to="/inscription" state={location.state} className="font-semibold text-choco-800 underline">Créer un compte</Link>
      </p>
    </AuthShell>
  );
}

export function Register() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={location.state?.from || '/compte'} replace />;

  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setErrors({ ...errors, [k]: undefined }); };
  const validate = () => {
    const e = {};
    if (form.full_name.trim().length < 2) e.full_name = 'Indiquez votre nom complet.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Email invalide.';
    if (!/^(\+?221)?\s?(7[0-8])\s?\d{3}\s?\d{2}\s?\d{2}$/.test(form.phone.trim())) e.phone = 'Numéro sénégalais invalide (ex : 77 000 00 00).';
    if (form.password.length < 8 || !/\d/.test(form.password) || !/[A-Za-z]/.test(form.password)) e.password = '8 caractères minimum, avec au moins une lettre et un chiffre.';
    if (form.confirm !== form.password) e.confirm = 'Les mots de passe ne correspondent pas.';
    return e;
  };
  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true); setError('');
    try {
      await register({ full_name: form.full_name, email: form.email, phone: form.phone, password: form.password });
      navigate(location.state?.from || '/compte', { replace: true });
    } catch (err) { setError(err.message); setErrors(err.fieldErrors || {}); } finally { setBusy(false); }
  };

  const fields = [
    ['full_name', 'Nom complet', 'text', 'name', 'Awa Ndiaye'],
    ['email', 'Email', 'email', 'email', 'vous@exemple.sn'],
    ['phone', 'Téléphone', 'tel', 'tel', '77 000 00 00'],
  ];
  return (
    <AuthShell title="Créer un compte" subtitle="Suivez vos commandes et commandez plus vite">
      <form onSubmit={submit} noValidate className="space-y-4">
        {fields.map(([k, l, type, ac, ph]) => (
          <div key={k}>
            <label htmlFor={k} className="label">{l}</label>
            <input id={k} type={type} autoComplete={ac} placeholder={ph} value={form[k]} onChange={set(k)} className="input" />
            {errors[k] && <p className="field-error">{errors[k]}</p>}
          </div>
        ))}
        <div>
          <label htmlFor="password" className="label">Mot de passe</label>
          <PasswordInput id="password" autoComplete="new-password" value={form.password} onChange={set('password')} />
          {errors.password && <p className="field-error">{errors.password}</p>}
        </div>
        <div>
          <label htmlFor="confirm" className="label">Confirmer le mot de passe</label>
          <PasswordInput id="confirm" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />
          {errors.confirm && <p className="field-error">{errors.confirm}</p>}
        </div>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
        <p className="text-xs text-stone-500">En créant un compte, vous acceptez nos <Link to="/cgv" className="underline">CGV</Link> et notre <Link to="/confidentialite" className="underline">politique de confidentialité</Link>.</p>
        <button disabled={busy} className="btn-primary w-full !py-3">{busy ? 'Création…' : 'Créer mon compte'}</button>
      </form>
      <p className="mt-6 text-center text-sm">Déjà inscrite ? <Link to="/connexion" state={location.state} className="font-semibold text-choco-800 underline">Se connecter</Link></p>
    </AuthShell>
  );
}
