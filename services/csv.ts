
export const downloadCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }
  
  // Get all unique keys from all objects to handle sparse data
  const allKeys = new Set<string>();
  data.forEach(item => Object.keys(item).forEach(k => allKeys.add(k)));
  const headers = Array.from(allKeys);
  
  // Create CSV content
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(row => headers.map(fieldName => {
      const val = row[fieldName];
      // Escape quotes and handle commas
      const stringVal = val === null || val === undefined ? '' : String(val);
      // Remove line breaks from string values
      const cleanVal = stringVal.replace(/(\r\n|\n|\r)/gm, " ");
      return `"${cleanVal.replace(/"/g, '""')}"`; 
    }).join(','))
  ];
  
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', `${filename}_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
