import React, { useState } from 'react';

const RegisterBDA: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageColor, setMessageColor] = useState<'green' | 'red'>('green');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      setMessageColor('red');
      return;
    }

    const token = localStorage.getItem('jwtToken');
    if (!token) {
      setMessage('Unauthorized: Admin token missing');
      setMessageColor('red');
      return;
    }

    try {
      const res = await fetch('/api/admin/register-bda', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, email, phone, password })
      });

      const text = await res.text();
      if (res.ok) {
        setMessage('BDA registered successfully!');
        setMessageColor('green');
        setName('');
        setEmail('');
        setPhone('');
        setPassword('');
        setConfirmPassword('');
      } else {
        setMessage(text);
        setMessageColor('red');
      }
    } catch {
      setMessage('Server error');
      setMessageColor('red');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 shadow-md rounded-lg border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-center">Register</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded"
        />
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded"
        />
        <input
          type="text"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded"
        />
        <p className="text-sm text-gray-500">
          Minimum 8 characters with a mix of uppercase, lowercase, number, and symbol.
        </p>
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Submit
        </button>
        {message && <div className={`text-${messageColor}-600 mt-2`}>{message}</div>}
      </form>
    </div>
  );
};

export default RegisterBDA;
