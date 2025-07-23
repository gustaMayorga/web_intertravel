const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Ingresa la contraseña para gustavo.mayorga@intertravel.com.ar: ', async (password) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('\n===========================================');
    console.log('COMANDO SQL PARA CREAR USUARIO ADMIN:');
    console.log('===========================================');
    console.log('');
    console.log(`INSERT INTO users (username, email, password_hash, role, full_name, is_active) VALUES ('gustavo.mayorga@intertravel.com.ar', 'gustavo.mayorga@intertravel.com.ar', '${hashedPassword}', 'super_admin', 'Gustavo Mayorga', true);`);
    console.log('');
    console.log('===========================================');
    console.log('PASOS:');
    console.log('1. Copia el comando SQL de arriba');
    console.log('2. Ejecuta: psql -U intertravel_user -d intertravel_prod');
    console.log('3. Pega el comando y presiona Enter');
    console.log('4. Escribe \\q para salir');
    console.log('5. Ya puedes hacer login en http://localhost:3005');
    console.log('===========================================');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  rl.close();
});
