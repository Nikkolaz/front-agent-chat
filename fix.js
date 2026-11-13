const fs = require('fs');
const file = 'src/pages/ReporteDetail.jsx';
let data = fs.readFileSync(file, 'utf8');
data = data.replace('Validar con SuperAudi', 'Validar con SuperAudi');
fs.writeFileSync(file, data);
