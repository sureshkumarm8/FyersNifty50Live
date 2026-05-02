
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

export const parseCSV = (csvText: string): any[] => {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  // Better CSV parsing that handles quotes and commas
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };
  
  const headers = parseLine(lines[0]);
  const data: any[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const row: any = {};
    
    headers.forEach((header, index) => {
      const value = values[index] || '';
      // Try to parse as number
      const numValue = parseFloat(value);
      row[header] = isNaN(numValue) ? value : numValue;
    });
    
    data.push(row);
  }
  
  return data;
};

export const importCSVFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const data = parseCSV(csvText);
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};
