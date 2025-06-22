// ===================================================
// MÓDULO CONTABLE ADMINISTRATIVO - INTERTRAVEL
// ===================================================
// Funcionalidades críticas para operaciones financieras
// Estado: IMPLEMENTACIÓN COMPLETA
// Fecha: 11 de Junio 2025

const { query, getClient } = require('../database');

class AccountingModule {
  
  // ===== DASHBOARD FINANCIERO =====
  async getDashboardData() {
    try {
      // Resumen financiero del mes actual
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      // Ingresos del mes
      const monthlyRevenue = await query(`
        SELECT 
          COALESCE(SUM(i.total_amount), 0) as total_invoiced,
          COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.total_amount ELSE 0 END), 0) as total_paid,
          COUNT(i.id) as total_invoices,
          COUNT(CASE WHEN i.status = 'paid' THEN 1 END) as paid_invoices
        FROM invoices i
        WHERE i.issue_date >= $1 AND i.issue_date <= $2
      `, [startOfMonth, endOfMonth]);

      // Cuentas por cobrar
      const accountsReceivable = await query(`
        SELECT 
          COALESCE(SUM(total_amount), 0) as total_pending,
          COUNT(*) as pending_invoices,
          COALESCE(SUM(CASE WHEN due_date < CURRENT_DATE THEN total_amount ELSE 0 END), 0) as overdue_amount,
          COUNT(CASE WHEN due_date < CURRENT_DATE THEN 1 END) as overdue_invoices
        FROM invoices
        WHERE status IN ('sent', 'overdue')
      `);

      // Top agencias por facturación
      const topAgencies = await query(`
        SELECT 
          a.name,
          a.code,
          COALESCE(SUM(i.total_amount), 0) as total_billed,
          COUNT(i.id) as invoice_count
        FROM agencies a
        LEFT JOIN invoices i ON a.id = i.agency_id 
          AND i.issue_date >= $1 AND i.issue_date <= $2
        WHERE a.status = 'active'
        GROUP BY a.id, a.name, a.code
        ORDER BY total_billed DESC
        LIMIT 10
      `, [startOfMonth, endOfMonth]);

      // Últimas transacciones
      const recentTransactions = await query(`
        SELECT 
          t.transaction_number,
          t.transaction_date,
          t.description,
          t.total_amount,
          t.status,
          u.full_name as created_by_name
        FROM transactions t
        LEFT JOIN users u ON t.created_by = u.id
        ORDER BY t.created_at DESC
        LIMIT 10
      `);

      // Balance de cuentas principales
      const balances = await query(`
        SELECT 
          fa.account_code,
          fa.account_name,
          fa.account_type,
          COALESCE(SUM(te.debit_amount - te.credit_amount), 0) as balance
        FROM financial_accounts fa
        LEFT JOIN transaction_entries te ON fa.id = te.account_id
        LEFT JOIN transactions t ON te.transaction_id = t.id AND t.status = 'posted'
        WHERE fa.level = 1
        GROUP BY fa.id, fa.account_code, fa.account_name, fa.account_type
        ORDER BY fa.account_code
      `);

      return {
        success: true,
        data: {
          monthly_revenue: monthlyRevenue.rows[0],
          accounts_receivable: accountsReceivable.rows[0],
          top_agencies: topAgencies.rows,
          recent_transactions: recentTransactions.rows,
          account_balances: balances.rows,
          period: {
            start: startOfMonth,
            end: endOfMonth
          }
        }
      };

    } catch (error) {
      console.error('❌ Error obteniendo dashboard contable:', error);
      return { success: false, error: error.message };
    }
  }

  // ===== PLAN DE CUENTAS =====
  async getChartOfAccounts() {
    try {
      const accounts = await query(`
        SELECT 
          fa.*,
          parent.account_name as parent_name,
          COALESCE(SUM(te.debit_amount - te.credit_amount), 0) as current_balance
        FROM financial_accounts fa
        LEFT JOIN financial_accounts parent ON fa.parent_account_id = parent.id
        LEFT JOIN transaction_entries te ON fa.id = te.account_id
        LEFT JOIN transactions t ON te.transaction_id = t.id AND t.status = 'posted'
        WHERE fa.is_active = true
        GROUP BY fa.id, parent.account_name
        ORDER BY fa.account_code
      `);

      return {
        success: true,
        data: accounts.rows
      };
    } catch (error) {
      console.error('❌ Error obteniendo plan de cuentas:', error);
      return { success: false, error: error.message };
    }
  }

  async createAccount(accountData) {
    try {
      const { account_code, account_name, account_type, parent_account_id } = accountData;
      
      // Verificar si el código ya existe
      const existing = await query('SELECT id FROM financial_accounts WHERE account_code = $1', [account_code]);
      if (existing.rows.length > 0) {
        return { success: false, error: 'El código de cuenta ya existe' };
      }

      // Determinar el nivel
      let level = 1;
      if (parent_account_id) {
        const parent = await query('SELECT level FROM financial_accounts WHERE id = $1', [parent_account_id]);
        if (parent.rows.length > 0) {
          level = parent.rows[0].level + 1;
        }
      }

      const result = await query(`
        INSERT INTO financial_accounts (account_code, account_name, account_type, parent_account_id, level)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [account_code, account_name, account_type, parent_account_id || null, level]);

      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      console.error('❌ Error creando cuenta:', error);
      return { success: false, error: error.message };
    }
  }

  // ===== TRANSACCIONES CONTABLES =====
  async createTransaction(transactionData, userId) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      const { transaction_date, reference, description, entries } = transactionData;
      
      // Generar número de transacción
      const transactionNumber = await this.generateTransactionNumber();
      
      // Calcular total (debe ser 0 en contabilidad de doble entrada)
      const totalDebits = entries.reduce((sum, entry) => sum + parseFloat(entry.debit_amount || 0), 0);
      const totalCredits = entries.reduce((sum, entry) => sum + parseFloat(entry.credit_amount || 0), 0);
      
      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        throw new Error('Los débitos y créditos deben estar balanceados');
      }

      // Crear transacción principal
      const transactionResult = await client.query(`
        INSERT INTO transactions (transaction_number, transaction_date, reference, description, total_amount, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [transactionNumber, transaction_date, reference, description, totalDebits, userId]);

      const transactionId = transactionResult.rows[0].id;

      // Crear entradas de detalle
      for (const entry of entries) {
        await client.query(`
          INSERT INTO transaction_entries (transaction_id, account_id, debit_amount, credit_amount, description)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          transactionId,
          entry.account_id,
          entry.debit_amount || 0,
          entry.credit_amount || 0,
          entry.description || description
        ]);
      }

      await client.query('COMMIT');

      return {
        success: true,
        data: {
          transaction: transactionResult.rows[0],
          entries: entries.length
        }
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error creando transacción:', error);
      return { success: false, error: error.message };
    } finally {
      client.release();
    }
  }

  async postTransaction(transactionId, userId) {
    try {
      const result = await query(`
        UPDATE transactions 
        SET status = 'posted', approved_by = $1, posted_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND status = 'pending'
        RETURNING *
      `, [userId, transactionId]);

      if (result.rows.length === 0) {
        return { success: false, error: 'Transacción no encontrada o ya procesada' };
      }

      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      console.error('❌ Error contabilizando transacción:', error);
      return { success: false, error: error.message };
    }
  }

  async generateTransactionNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    const result = await query(`
      SELECT COUNT(*) as count 
      FROM transactions 
      WHERE transaction_number LIKE $1
    `, [`AST${year}${month}%`]);
    
    const sequence = parseInt(result.rows[0].count) + 1;
    return `AST${year}${month}${String(sequence).padStart(4, '0')}`;
  }

  // ===== FACTURACIÓN =====
  async createInvoice(invoiceData, userId) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      const { agency_id, issue_date, due_date, lines, notes } = invoiceData;
      
      // Generar número de factura
      const invoiceNumber = await this.generateInvoiceNumber();
      
      // Calcular totales
      let subtotal = 0;
      let taxAmount = 0;
      
      for (const line of lines) {
        const lineTotal = parseFloat(line.quantity) * parseFloat(line.unit_price);
        const lineTax = lineTotal * (parseFloat(line.tax_rate || 0) / 100);
        subtotal += lineTotal;
        taxAmount += lineTax;
      }
      
      const totalAmount = subtotal + taxAmount;

      // Crear factura
      const invoiceResult = await client.query(`
        INSERT INTO invoices (invoice_number, agency_id, issue_date, due_date, subtotal, tax_amount, total_amount, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [invoiceNumber, agency_id, issue_date, due_date, subtotal, taxAmount, totalAmount, notes]);

      const invoiceId = invoiceResult.rows[0].id;

      // Crear líneas de factura
      for (const line of lines) {
        const lineTotal = parseFloat(line.quantity) * parseFloat(line.unit_price);
        await client.query(`
          INSERT INTO invoice_lines (invoice_id, description, quantity, unit_price, line_total, tax_rate)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [invoiceId, line.description, line.quantity, line.unit_price, lineTotal, line.tax_rate || 0]);
      }

      // Crear asiento contable automático si se especifica
      if (invoiceData.auto_post) {
        await this.createInvoiceAccountingEntry(invoiceId, agency_id, totalAmount, userId, client);
      }

      await client.query('COMMIT');

      return {
        success: true,
        data: invoiceResult.rows[0]
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error creando factura:', error);
      return { success: false, error: error.message };
    } finally {
      client.release();
    }
  }

  async generateInvoiceNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    const result = await query(`
      SELECT COUNT(*) as count 
      FROM invoices 
      WHERE invoice_number LIKE $1
    `, [`FC${year}${month}%`]);
    
    const sequence = parseInt(result.rows[0].count) + 1;
    return `FC${year}${month}${String(sequence).padStart(4, '0')}`;
  }

  async createInvoiceAccountingEntry(invoiceId, agencyId, amount, userId, client) {
    try {
      // Obtener cuentas necesarias
      const accountsResult = await client.query(`
        SELECT 
          (SELECT id FROM financial_accounts WHERE account_code = '1.1.3') as accounts_receivable,
          (SELECT id FROM financial_accounts WHERE account_code = '4.2') as commission_revenue
      `);

      if (!accountsResult.rows[0].accounts_receivable || !accountsResult.rows[0].commission_revenue) {
        throw new Error('Cuentas contables no configuradas correctamente');
      }

      const transactionNumber = await this.generateTransactionNumber();
      
      // Crear transacción
      const transactionResult = await client.query(`
        INSERT INTO transactions (transaction_number, transaction_date, reference, description, total_amount, created_by, status)
        VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, 'posted')
        RETURNING id
      `, [
        transactionNumber,
        `Factura ${invoiceId}`,
        `Facturación automática - Agencia ID ${agencyId}`,
        amount,
        userId
      ]);

      const transactionId = transactionResult.rows[0].id;

      // Débito: Cuentas por Cobrar
      await client.query(`
        INSERT INTO transaction_entries (transaction_id, account_id, debit_amount, credit_amount, description)
        VALUES ($1, $2, $3, 0, $4)
      `, [transactionId, accountsResult.rows[0].accounts_receivable, amount, 'Cuentas por cobrar agencias']);

      // Crédito: Ingresos por Comisiones
      await client.query(`
        INSERT INTO transaction_entries (transaction_id, account_id, debit_amount, credit_amount, description)
        VALUES ($1, $2, 0, $3, $4)
      `, [transactionId, accountsResult.rows[0].commission_revenue, amount, 'Ingresos por comisiones']);

      return transactionId;
    } catch (error) {
      throw error;
    }
  }

  // ===== REPORTES FINANCIEROS =====
  async getBalanceSheet(asOfDate = null) {
    try {
      const cutoffDate = asOfDate || new Date();
      
      const balances = await query(`
        SELECT 
          fa.account_code,
          fa.account_name,
          fa.account_type,
          fa.level,
          COALESCE(SUM(te.debit_amount - te.credit_amount), 0) as balance
        FROM financial_accounts fa
        LEFT JOIN transaction_entries te ON fa.id = te.account_id
        LEFT JOIN transactions t ON te.transaction_id = t.id 
          AND t.status = 'posted' 
          AND t.transaction_date <= $1
        WHERE fa.is_active = true
        GROUP BY fa.id, fa.account_code, fa.account_name, fa.account_type, fa.level
        HAVING COALESCE(SUM(te.debit_amount - te.credit_amount), 0) != 0
        ORDER BY fa.account_code
      `, [cutoffDate]);

      // Organizar por tipo de cuenta
      const organized = {
        assets: balances.rows.filter(acc => acc.account_type === 'assets'),
        liabilities: balances.rows.filter(acc => acc.account_type === 'liabilities'),
        equity: balances.rows.filter(acc => acc.account_type === 'equity')
      };

      // Calcular totales
      const totalAssets = organized.assets.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
      const totalLiabilities = organized.liabilities.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
      const totalEquity = organized.equity.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);

      return {
        success: true,
        data: {
          as_of_date: cutoffDate,
          accounts: organized,
          totals: {
            assets: totalAssets,
            liabilities: Math.abs(totalLiabilities),
            equity: Math.abs(totalEquity),
            balanced: Math.abs(totalAssets - Math.abs(totalLiabilities) - Math.abs(totalEquity)) < 0.01
          }
        }
      };

    } catch (error) {
      console.error('❌ Error generando balance:', error);
      return { success: false, error: error.message };
    }
  }

  async getIncomeStatement(startDate, endDate) {
    try {
      const incomeAccounts = await query(`
        SELECT 
          fa.account_code,
          fa.account_name,
          fa.account_type,
          COALESCE(SUM(te.credit_amount - te.debit_amount), 0) as amount
        FROM financial_accounts fa
        LEFT JOIN transaction_entries te ON fa.id = te.account_id
        LEFT JOIN transactions t ON te.transaction_id = t.id 
          AND t.status = 'posted' 
          AND t.transaction_date >= $1 
          AND t.transaction_date <= $2
        WHERE fa.is_active = true 
          AND fa.account_type IN ('revenue', 'expenses')
        GROUP BY fa.id, fa.account_code, fa.account_name, fa.account_type
        HAVING COALESCE(SUM(te.credit_amount - te.debit_amount), 0) != 0
        ORDER BY fa.account_code
      `, [startDate, endDate]);

      const revenue = incomeAccounts.rows.filter(acc => acc.account_type === 'revenue');
      const expenses = incomeAccounts.rows.filter(acc => acc.account_type === 'expenses');

      const totalRevenue = revenue.reduce((sum, acc) => sum + parseFloat(acc.amount), 0);
      const totalExpenses = expenses.reduce((sum, acc) => sum + Math.abs(parseFloat(acc.amount)), 0);
      const netIncome = totalRevenue - totalExpenses;

      return {
        success: true,
        data: {
          period: { start: startDate, end: endDate },
          revenue: revenue,
          expenses: expenses,
          totals: {
            revenue: totalRevenue,
            expenses: totalExpenses,
            net_income: netIncome
          }
        }
      };

    } catch (error) {
      console.error('❌ Error generando estado de resultados:', error);
      return { success: false, error: error.message };
    }
  }

  // ===== GESTIÓN DE PAGOS =====
  async recordPayment(paymentData, userId) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      const { invoice_id, amount, payment_method, payment_date, reference, notes } = paymentData;
      
      // Verificar factura
      const invoiceResult = await client.query(`
        SELECT * FROM invoices WHERE id = $1 AND status != 'cancelled'
      `, [invoice_id]);

      if (invoiceResult.rows.length === 0) {
        throw new Error('Factura no encontrada o cancelada');
      }

      const invoice = invoiceResult.rows[0];
      
      // Generar número de pago
      const paymentNumber = await this.generatePaymentNumber();
      
      // Registrar pago
      const paymentResult = await client.query(`
        INSERT INTO payment_records (payment_number, invoice_id, agency_id, amount, payment_method, payment_date, reference, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [paymentNumber, invoice_id, invoice.agency_id, amount, payment_method, payment_date, reference, notes]);

      // Verificar si la factura está completamente pagada
      const totalPaid = await client.query(`
        SELECT COALESCE(SUM(amount), 0) as total_paid
        FROM payment_records
        WHERE invoice_id = $1 AND status = 'confirmed'
      `, [invoice_id]);

      const paidAmount = parseFloat(totalPaid.rows[0].total_paid);
      const invoiceAmount = parseFloat(invoice.total_amount);

      if (paidAmount >= invoiceAmount) {
        // Marcar factura como pagada
        await client.query(`
          UPDATE invoices 
          SET status = 'paid', paid_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [invoice_id]);
      }

      // Crear asiento contable del pago
      await this.createPaymentAccountingEntry(invoice_id, amount, payment_method, userId, client);

      await client.query('COMMIT');

      return {
        success: true,
        data: paymentResult.rows[0]
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error registrando pago:', error);
      return { success: false, error: error.message };
    } finally {
      client.release();
    }
  }

  async generatePaymentNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    const result = await query(`
      SELECT COUNT(*) as count 
      FROM payment_records 
      WHERE payment_number LIKE $1
    `, [`PAG${year}${month}%`]);
    
    const sequence = parseInt(result.rows[0].count) + 1;
    return `PAG${year}${month}${String(sequence).padStart(4, '0')}`;
  }

  async createPaymentAccountingEntry(invoiceId, amount, paymentMethod, userId, client) {
    try {
      // Determinar cuenta de destino según método de pago
      let destinationAccount = '1.1.1'; // Caja y Bancos por defecto
      
      // Obtener cuentas necesarias
      const accountsResult = await client.query(`
        SELECT 
          (SELECT id FROM financial_accounts WHERE account_code = $1) as destination,
          (SELECT id FROM financial_accounts WHERE account_code = '1.1.3') as accounts_receivable
      `, [destinationAccount]);

      if (!accountsResult.rows[0].destination || !accountsResult.rows[0].accounts_receivable) {
        throw new Error('Cuentas contables no configuradas correctamente');
      }

      const transactionNumber = await this.generateTransactionNumber();
      
      // Crear transacción
      const transactionResult = await client.query(`
        INSERT INTO transactions (transaction_number, transaction_date, reference, description, total_amount, created_by, status)
        VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, 'posted')
        RETURNING id
      `, [
        transactionNumber,
        `Pago Factura ${invoiceId}`,
        `Pago recibido - ${paymentMethod}`,
        amount,
        userId
      ]);

      const transactionId = transactionResult.rows[0].id;

      // Débito: Caja/Bancos
      await client.query(`
        INSERT INTO transaction_entries (transaction_id, account_id, debit_amount, credit_amount, description)
        VALUES ($1, $2, $3, 0, $4)
      `, [transactionId, accountsResult.rows[0].destination, amount, `Pago recibido - ${paymentMethod}`]);

      // Crédito: Cuentas por Cobrar
      await client.query(`
        INSERT INTO transaction_entries (transaction_id, account_id, debit_amount, credit_amount, description)
        VALUES ($1, $2, 0, $3, $4)
      `, [transactionId, accountsResult.rows[0].accounts_receivable, amount, 'Cobranza cuentas por cobrar']);

      return transactionId;
    } catch (error) {
      throw error;
    }
  }

  // ===== UTILIDADES =====
  async getAccountsReceivableReport() {
    try {
      const result = await query(`
        SELECT 
          i.id,
          i.invoice_number,
          i.issue_date,
          i.due_date,
          i.total_amount,
          i.status,
          a.name as agency_name,
          a.code as agency_code,
          COALESCE(SUM(pr.amount), 0) as paid_amount,
          (i.total_amount - COALESCE(SUM(pr.amount), 0)) as balance,
          CASE 
            WHEN i.due_date < CURRENT_DATE THEN CURRENT_DATE - i.due_date
            ELSE 0
          END as days_overdue
        FROM invoices i
        JOIN agencies a ON i.agency_id = a.id
        LEFT JOIN payment_records pr ON i.id = pr.invoice_id AND pr.status = 'confirmed'
        WHERE i.status IN ('sent', 'overdue', 'paid')
        GROUP BY i.id, i.invoice_number, i.issue_date, i.due_date, i.total_amount, i.status, a.name, a.code
        HAVING (i.total_amount - COALESCE(SUM(pr.amount), 0)) > 0.01
        ORDER BY i.due_date ASC
      `);

      return {
        success: true,
        data: result.rows
      };
    } catch (error) {
      console.error('❌ Error obteniendo reporte de cuentas por cobrar:', error);
      return { success: false, error: error.message };
    }
  }

  async getAgencyCommissionSummary(agencyId, startDate, endDate) {
    try {
      const result = await query(`
        SELECT 
          COUNT(i.id) as total_invoices,
          COALESCE(SUM(i.total_amount), 0) as total_invoiced,
          COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.total_amount ELSE 0 END), 0) as total_paid,
          COALESCE(SUM(CASE WHEN i.status IN ('sent', 'overdue') THEN i.total_amount ELSE 0 END), 0) as total_pending,
          AVG(i.total_amount) as average_invoice
        FROM invoices i
        WHERE i.agency_id = $1
          AND i.issue_date >= $2
          AND i.issue_date <= $3
      `, [agencyId, startDate, endDate]);

      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      console.error('❌ Error obteniendo resumen de comisiones:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new AccountingModule();
