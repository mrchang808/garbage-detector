const Dashboard = () => {
  const sampleData = [
    { className: 'Plastic', count: 'soon to be implemented' },
    { className: 'Glass', count: 'soon to be implemented' },
    { className: 'Metal', count: 'soon to be implemented' },
    { className: 'Paper', count: 'soon to be implemented' },
  ];

  return (
    <div style={{
      padding: '40px',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif',
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Dashboard</h2>
      <p style={{ fontSize: '18px', marginBottom: '20px' }}>Overview of Detections:</p>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '16px'
      }}>
        <thead>
          <tr style={{ backgroundColor: '#ecf0f1' }}>
            <th style={{ padding: '10px', border: '1px solid #000000', color: '#000000' }}>Class</th>
            <th style={{ padding: '10px', border: '1px solid #000000', color: '#000000' }}>Count</th>
          </tr>
        </thead>
        <tbody>
          {sampleData.map((data, index) => (
            <tr key={index} style={{ textAlign: 'center' }}>
              <td style={{ padding: '10px', border: '1px solid' }}>{data.className}</td>
              <td style={{ padding: '10px', border: '1px solid' }}>{data.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Dashboard;
