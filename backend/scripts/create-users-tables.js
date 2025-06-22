// Script para crear las tablas del sistema de usuarios y agencias
// ================================================================

require('dotenv').config();
const { dbManager } = require('../database');
const bcrypt = require('bcrypt');

async function createUsersTables() {
  try {
    console.log('🚀 Creando sistema de usuarios y agencias...');
    
    // Conectar a la base de datos
    await dbManager.connect();
    
    // 1. Crear tabla de roles
    await dbManager.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        description TEXT,
        permissions JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 2. Crear tabla de agencias
    await dbManager.query(`
      CREATE TABLE IF NOT EXISTS agencies (
        id SERIAL PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        business_name VARCHAR(255),
        cuit VARCHAR(13),
        address TEXT,
        city VARCHAR(100),
        province VARCHAR(100),
        country VARCHAR(100) DEFAULT 'Argentina',
        phone VARCHAR(50),
        email VARCHAR(255),
        contact_person VARCHAR(255),
        commission_rate DECIMAL(5,2) DEFAULT 10.00,
        credit_limit DECIMAL(12,2) DEFAULT 0.00,
        current_balance DECIMAL(12,2) DEFAULT 0.00,
        status VARCHAR(20) DEFAULT 'pending',
        contract_date DATE,
        notes TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        updated_by INTEGER
      )
    `);
    
    // 3. Actualizar tabla de usuarios para incluir agencias
    await dbManager.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS agency_id INTEGER REFERENCES agencies(id),
      ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id),
      ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500),
      ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP,
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS created_by INTEGER,
      ADD COLUMN IF NOT EXISTS updated_by INTEGER
    `);
    
    // 4. Crear tabla de permisos específicos
    await dbManager.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        display_name VARCHAR(150) NOT NULL,
        description TEXT,
        module VARCHAR(50) NOT NULL,
        category VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 5. Crear tabla de sesiones de usuario
    await dbManager.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        ip_address INET,
        user_agent TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 6. Crear tabla de logs de acceso
    await dbManager.query(`
      CREATE TABLE IF NOT EXISTS user_access_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        ip_address INET,
        user_agent TEXT,
        success BOOLEAN DEFAULT true,
        details JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 7. Crear índices para mejor performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_agency_id ON users(agency_id)',
      'CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id)', 
      'CREATE INDEX IF NOT EXISTS idx_users_last_activity ON users(last_activity)',
      'CREATE INDEX IF NOT EXISTS idx_agencies_code ON agencies(code)',
      'CREATE INDEX IF NOT EXISTS idx_agencies_status ON agencies(status)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at)',
      'CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON user_access_logs(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON user_access_logs(created_at)'
    ];
    
    for (const index of indexes) {
      try {
        await dbManager.query(index);
      } catch (error) {
        console.log(`⚠️ Índice ya existe: ${index.split(' ')[5]}`);
      }
    }
    
    console.log('✅ Tablas del sistema de usuarios creadas exitosamente');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error creando tablas:', error);
    return { success: false, error: error.message };
  }
}

async function insertDefaultRolesAndPermissions() {
  try {
    console.log('📝 Insertando roles y permisos por defecto...');
    
    // Permisos por defecto
    const permissions = [
      // Dashboard
      { name: 'dashboard.view', display_name: 'Ver Dashboard', module: 'dashboard', category: 'general' },
      { name: 'dashboard.stats', display_name: 'Ver Estadísticas', module: 'dashboard', category: 'analytics' },
      
      // Paquetes
      { name: 'packages.view', display_name: 'Ver Paquetes', module: 'packages', category: 'travel' },
      { name: 'packages.create', display_name: 'Crear Paquetes', module: 'packages', category: 'travel' },
      { name: 'packages.edit', display_name: 'Editar Paquetes', module: 'packages', category: 'travel' },
      { name: 'packages.delete', display_name: 'Eliminar Paquetes', module: 'packages', category: 'travel' },
      { name: 'packages.manage', display_name: 'Gestionar Paquetes', module: 'packages', category: 'travel' },
      
      // Reservas
      { name: 'bookings.view', display_name: 'Ver Reservas', module: 'bookings', category: 'sales' },
      { name: 'bookings.create', display_name: 'Crear Reservas', module: 'bookings', category: 'sales' },
      { name: 'bookings.edit', display_name: 'Editar Reservas', module: 'bookings', category: 'sales' },
      { name: 'bookings.delete', display_name: 'Cancelar Reservas', module: 'bookings', category: 'sales' },
      { name: 'bookings.manage', display_name: 'Gestionar Reservas', module: 'bookings', category: 'sales' },
      
      // Leads/CRM
      { name: 'leads.view', display_name: 'Ver Leads', module: 'leads', category: 'marketing' },
      { name: 'leads.create', display_name: 'Crear Leads', module: 'leads', category: 'marketing' },
      { name: 'leads.edit', display_name: 'Editar Leads', module: 'leads', category: 'marketing' },
      { name: 'leads.delete', display_name: 'Eliminar Leads', module: 'leads', category: 'marketing' },
      
      // Agencias
      { name: 'agencies.view', display_name: 'Ver Agencias', module: 'agencies', category: 'admin' },
      { name: 'agencies.create', display_name: 'Crear Agencias', module: 'agencies', category: 'admin' },
      { name: 'agencies.edit', display_name: 'Editar Agencias', module: 'agencies', category: 'admin' },
      { name: 'agencies.delete', display_name: 'Eliminar Agencias', module: 'agencies', category: 'admin' },
      { name: 'agencies.manage', display_name: 'Gestionar Agencias', module: 'agencies', category: 'admin' },
      
      // Usuarios
      { name: 'users.view', display_name: 'Ver Usuarios', module: 'users', category: 'admin' },
      { name: 'users.create', display_name: 'Crear Usuarios', module: 'users', category: 'admin' },
      { name: 'users.edit', display_name: 'Editar Usuarios', module: 'users', category: 'admin' },
      { name: 'users.delete', display_name: 'Eliminar Usuarios', module: 'users', category: 'admin' },
      { name: 'users.manage', display_name: 'Gestionar Usuarios', module: 'users', category: 'admin' },
      
      // Sistema
      { name: 'system.config', display_name: 'Configurar Sistema', module: 'system', category: 'admin' },
      { name: 'system.logs', display_name: 'Ver Logs', module: 'system', category: 'admin' },
      { name: 'system.backup', display_name: 'Backup Sistema', module: 'system', category: 'admin' },
      
      // Reportes
      { name: 'reports.view', display_name: 'Ver Reportes', module: 'reports', category: 'analytics' },
      { name: 'reports.export', display_name: 'Exportar Reportes', module: 'reports', category: 'analytics' },
      
      // Finanzas
      { name: 'finance.view', display_name: 'Ver Finanzas', module: 'finance', category: 'accounting' },
      { name: 'finance.manage', display_name: 'Gestionar Finanzas', module: 'finance', category: 'accounting' }
    ];
    
    // Insertar permisos
    for (const perm of permissions) {
      await dbManager.query(`
        INSERT INTO permissions (name, display_name, description, module, category)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (name) DO NOTHING
      `, [perm.name, perm.display_name, perm.description || perm.display_name, perm.module, perm.category]);
    }
    
    // Roles por defecto
    const roles = [
      {
        name: 'super_admin',
        display_name: 'Super Administrador',
        description: 'Acceso completo al sistema',
        permissions: permissions.map(p => p.name) // Todos los permisos
      },
      {
        name: 'admin',
        display_name: 'Administrador',
        description: 'Administrador general del sistema',
        permissions: [
          'dashboard.view', 'dashboard.stats',
          'packages.view', 'packages.create', 'packages.edit', 'packages.manage',
          'bookings.view', 'bookings.create', 'bookings.edit', 'bookings.manage',
          'leads.view', 'leads.create', 'leads.edit',
          'agencies.view', 'agencies.edit',
          'users.view', 'users.create', 'users.edit',
          'reports.view', 'reports.export',
          'finance.view'
        ]
      },
      {
        name: 'agency_admin',
        display_name: 'Administrador de Agencia',
        description: 'Administrador de una agencia específica',
        permissions: [
          'dashboard.view',
          'packages.view',
          'bookings.view', 'bookings.create', 'bookings.edit',
          'leads.view', 'leads.create', 'leads.edit',
          'users.view', 'users.create', 'users.edit',
          'reports.view'
        ]
      },
      {
        name: 'agency_user',
        display_name: 'Usuario de Agencia',
        description: 'Usuario operativo de agencia',
        permissions: [
          'dashboard.view',
          'packages.view',
          'bookings.view', 'bookings.create',
          'leads.view', 'leads.create'
        ]
      },
      {
        name: 'sales',
        display_name: 'Vendedor',
        description: 'Personal de ventas',
        permissions: [
          'dashboard.view',
          'packages.view',
          'bookings.view', 'bookings.create', 'bookings.edit',
          'leads.view', 'leads.create', 'leads.edit'
        ]
      }
    ];
    
    // Insertar roles
    for (const role of roles) {
      await dbManager.query(`
        INSERT INTO roles (name, display_name, description, permissions)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (name) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          description = EXCLUDED.description,
          permissions = EXCLUDED.permissions,
          updated_at = CURRENT_TIMESTAMP
      `, [role.name, role.display_name, role.description, JSON.stringify(role.permissions)]);
    }
    
    console.log('✅ Roles y permisos insertados exitosamente');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error insertando roles y permisos:', error);
    return { success: false, error: error.message };
  }
}

async function createDefaultUsers() {
  try {
    console.log('👥 Creando usuarios por defecto...');
    
    // Actualizar usuario admin existente
    const adminRoleResult = await dbManager.query('SELECT id FROM roles WHERE name = $1', ['super_admin']);
    const adminRoleId = adminRoleResult.rows[0]?.id;
    
    if (adminRoleId) {
      await dbManager.query(`
        UPDATE users 
        SET role_id = $1, first_name = $2, last_name = $3, email_verified = true
        WHERE username = $4
      `, [adminRoleId, 'Administrador', 'Principal', 'admin']);
      
      console.log('✅ Usuario admin actualizado');
    }
    
    // Crear agencia de ejemplo
    const existingAgency = await dbManager.query('SELECT id FROM agencies WHERE code = $1', ['DEMO001']);
    
    let agencyId;
    if (existingAgency.rows.length === 0) {
      const agencyResult = await dbManager.query(`
        INSERT INTO agencies (
          code, name, business_name, cuit, address, city, province, 
          phone, email, contact_person, commission_rate, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
      `, [
        'DEMO001',
        'Agencia Demo',
        'Agencia Demo S.A.',
        '20-12345678-9',
        'Av. San Martín 1234',
        'Mendoza',
        'Mendoza',
        '+54 261 123-4567',
        'demo@agencia.com',
        'Juan Pérez',
        12.50,
        'active'
      ]);
      
      agencyId = agencyResult.rows[0].id;
      console.log('✅ Agencia demo creada');
    } else {
      agencyId = existingAgency.rows[0].id;
    }
    
    // Crear usuarios adicionales
    const agencyAdminRoleResult = await dbManager.query('SELECT id FROM roles WHERE name = $1', ['agency_admin']);
    const agencyUserRoleResult = await dbManager.query('SELECT id FROM roles WHERE name = $1', ['agency_user']);
    
    const additionalUsers = [
      {
        username: 'intertravel',
        email: 'intertravel@demo.com',
        password: 'travel2024',
        role_id: adminRoleResult.rows[0]?.id,
        first_name: 'Inter',
        last_name: 'Travel',
        agency_id: null
      },
      {
        username: 'agencia_admin',
        email: 'admin@agencia.com',
        password: 'agencia123',
        role_id: agencyAdminRoleResult.rows[0]?.id,
        first_name: 'Administrador',
        last_name: 'Agencia',
        agency_id: agencyId
      },
      {
        username: 'agencia_user',
        email: 'user@agencia.com',
        password: 'user123',
        role_id: agencyUserRoleResult.rows[0]?.id,
        first_name: 'Usuario',
        last_name: 'Agencia',
        agency_id: agencyId
      }
    ];
    
    for (const user of additionalUsers) {
      const existingUser = await dbManager.query('SELECT id FROM users WHERE username = $1', [user.username]);
      
      if (existingUser.rows.length === 0) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        await dbManager.query(`
          INSERT INTO users (
            username, email, password_hash, role_id, first_name, last_name, 
            agency_id, is_active, email_verified
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          user.username, user.email, hashedPassword, user.role_id,
          user.first_name, user.last_name, user.agency_id, true, true
        ]);
        
        console.log(`✅ Usuario ${user.username} creado`);
      }
    }
    
    console.log('✅ Usuarios por defecto creados exitosamente');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error creando usuarios por defecto:', error);
    return { success: false, error: error.message };
  }
}

// Ejecutar script principal
async function main() {
  try {
    console.log('🚀 ================================================');
    console.log('🚀 CONFIGURANDO SISTEMA DE USUARIOS Y AGENCIAS');
    console.log('🚀 ================================================');
    
    const tablesResult = await createUsersTables();
    if (!tablesResult.success) {
      throw new Error(tablesResult.error);
    }
    
    const rolesResult = await insertDefaultRolesAndPermissions();
    if (!rolesResult.success) {
      throw new Error(rolesResult.error);
    }
    
    const usersResult = await createDefaultUsers();
    if (!usersResult.success) {
      throw new Error(usersResult.error);
    }
    
    console.log('🎉 ================================================');
    console.log('🎉 SISTEMA DE USUARIOS CONFIGURADO EXITOSAMENTE');
    console.log('🎉 ================================================');
    console.log('');
    console.log('📋 USUARIOS DISPONIBLES:');
    console.log('   👑 admin / admin123 (Super Admin)');
    console.log('   🎯 intertravel / travel2024 (Admin)');
    console.log('   🏢 agencia_admin / agencia123 (Admin Agencia)');
    console.log('   👤 agencia_user / user123 (Usuario Agencia)');
    console.log('');
    console.log('🏢 AGENCIAS:');
    console.log('   📊 DEMO001 - Agencia Demo (Activa)');
    console.log('');
    console.log('✅ Sistema listo para usar!');
    
  } catch (error) {
    console.error('❌ Error configurando sistema:', error);
    process.exit(1);
  } finally {
    await dbManager.disconnect();
    process.exit(0);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  createUsersTables,
  insertDefaultRolesAndPermissions,
  createDefaultUsers
};
