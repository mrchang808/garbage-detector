import React, { useState } from 'react';

const GarbageDetector = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://127.0.0.1:5000/detect', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult('Error during detection.');
    }
    setLoading(false);
  };

  return (
    <div>
      <h2>Garbage Detector</h2>
      <input type="file" onChange={handleFileChange} />
      {loading ? <p>Processing...</p> : result && <pre>{result}</pre>}
    </div>
  );
};

export default GarbageDetector;
