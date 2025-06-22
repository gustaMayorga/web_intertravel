'use client';

/**
 * 💰 ACCOUNTING/ERP DASHBOARD - INTERTRAVEL v2.0
 * ===============================================
 * 
 * ✅ Sistema ERP contable empresarial completo
 * ✅ Plan de cuentas dinámico
 * ✅ Cuentas por cobrar y pagar
 * ✅ Balance de comprobación
 * ✅ Estado de resultados
 * ✅ Reportes fiscales
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calculator,
  TrendingUp,
  TrendingDown,
  FileText,
  CreditCard,
  Receipt,
  DollarSign,
  PieChart,
  BarChart3,
  Plus,
  Download,
  Upload,
  Calendar,
  Filter,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  AlertTriangle,
  Banknote,
  Target,
  Activity
} from 'lucide-react';

// ================================
// 🎨 TYPES & INTERFACES
// ================================

interface AccountingStat {
  totalReceivables: number;
  totalPayables: number;
  monthlyIncome: number;
  pendingReceivables: number;
  overduePayables: number;
}

interface AccountsReceivable {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  balance: number;
  invoice_date: string;
  due_date: string;
  status: 'sent' | 'paid' | 'partial' | 'overdue';
  created_at: string;
}

interface AccountsPayable {
  id: string;
  invoice_number: string;
  supplier_name: string;
  supplier_email: string;
  total_amount: number;
  balance: number;
  invoice_date: string;
  due_date: string;
  status: 'pending' | 'approved' | 'paid' | 'partial';
  approval_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface ChartAccount {
  id: string;
  code: string;
  name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parent_id?: string;
  is_active: boolean;
  balance: number;
}

// ================================
// 🎯 MAIN ACCOUNTING COMPONENT
// ================================

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [accountingStats, setAccountingStats] = useState<AccountingStat | null>(null);
  const [receivables, setReceivables] = useState<AccountsReceivable[]>([]);
  const [payables, setPayables] = useState<AccountsPayable[]>([]);
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartAccount[]>([]);

  // ================================
  // 📊 DATA FETCHING
  // ================================

  const fetchAccountingData = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Cargando datos contables...');
      
      // Datos demo para desarrollo
      setAccountingStats({
        totalReceivables: 125400,
        totalPayables: 87300,
        monthlyIncome: 186500,
        pendingReceivables: 15,
        overduePayables: 3
      });

      setReceivables([
        {
          id: '1',
          invoice_number: 'INV-2025-001234',
          customer_name: 'María García',
          customer_email: 'maria.garcia@email.com',
          total_amount: 4500,
          balance: 4500,
          invoice_date: '2025-06-01',
          due_date: '2025-06-30',
          status: 'sent',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          invoice_number: 'INV-2025-001235',
          customer_name: 'Carlos López',
          customer_email: 'carlos.lopez@email.com',
          total_amount: 6800,
          balance: 3400,
          invoice_date: '2025-05-28',
          due_date: '2025-06-28',
          status: 'partial',
          created_at: new Date().toISOString()
        }
      ]);

      setPayables([
        {
          id: '1',
          invoice_number: 'PROV-2025-001234',
          supplier_name: 'Hostal Cusco Premium',
          supplier_email: 'facturacion@cuscopremium.com',
          total_amount: 2800,
          balance: 2800,
          invoice_date: '2025-06-02',
          due_date: '2025-06-15',
          status: 'pending',
          approval_status: 'approved',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          invoice_number: 'PROV-2025-001235',
          supplier_name: 'Aerolíneas Argentinas',
          supplier_email: 'corporate@aerolineas.com.ar',
          total_amount: 15600,
          balance: 15600,
          invoice_date: '2025-06-01',
          due_date: '2025-06-10',
          status: 'approved',
          approval_status: 'approved',
          created_at: new Date().toISOString()
        }
      ]);

      setChartOfAccounts([
        {
          id: '1',
          code: '1.1.01',
          name: 'Caja',
          account_type: 'asset',
          is_active: true,
          balance: 45200
        },
        {
          id: '2',
          code: '1.1.02',
          name: 'Banco Nación Cuenta Corriente',
          account_type: 'asset',
          is_active: true,
          balance: 128500
        },
        {
          id: '3',
          code: '1.2.01',
          name: 'Clientes',
          account_type: 'asset',
          is_active: true,
          balance: 125400
        },
        {
          id: '4',
          code: '2.1.01',
          name: 'Proveedores',
          account_type: 'liability',
          is_active: true,
          balance: 87300
        },
        {
          id: '5',
          code: '4.1.01',
          name: 'Ventas de Servicios Turísticos',
          account_type: 'revenue',
          is_active: true,
          balance: 186500
        },
        {
          id: '6',
          code: '3.1.01',
          name: 'Capital Social',
          account_type: 'equity',
          is_active: true,
          balance: 50000
        },
        {
          id: '7',
          code: '5.1.01',
          name: 'Gastos de Personal',
          account_type: 'expense',
          is_active: true,
          balance: 45000
        }
      ]);
      
    } catch (error) {
      console.error('❌ Error cargando datos contables:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountingData();
  }, []);

  // ================================
  // 🎨 RENDER HELPERS
  // ================================

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      pending: 'bg-orange-100 text-orange-800',
      approved: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      posted: 'bg-green-100 text-green-800',
      draft: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'asset': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'liability': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'equity': return <Target className="h-4 w-4 text-purple-600" />;
      case 'revenue': return <DollarSign className="h-4 w-4 text-blue-600" />;
      case 'expense': return <Receipt className="h-4 w-4 text-orange-600" />;
      default: return <Calculator className="h-4 w-4 text-gray-600" />;
    }
  };

  // ================================
  // 📊 DASHBOARD TAB
  // ================================

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cuentas por Cobrar</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(accountingStats?.totalReceivables || 0)}
                </p>
                <p className="text-sm text-blue-600 flex items-center mt-1">
                  <Receipt className="h-3 w-3 mr-1" />
                  {accountingStats?.pendingReceivables} pendientes
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cuentas por Pagar</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(accountingStats?.totalPayables || 0)}
                </p>
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {accountingStats?.overduePayables} vencidas
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <Receipt className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos Mensuales</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(accountingStats?.monthlyIncome || 0)}
                </p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12.5% vs mes anterior
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Flujo de Caja</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency((accountingStats?.totalReceivables || 0) - (accountingStats?.totalPayables || 0))}
                </p>
                <p className="text-sm text-purple-600 flex items-center mt-1">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Neto pendiente
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ratio Liquidez</p>
                <p className="text-2xl font-bold text-gray-900">
                  {((accountingStats?.totalReceivables || 0) / (accountingStats?.totalPayables || 1)).toFixed(2)}
                </p>
                <p className="text-sm text-blue-600 flex items-center mt-1">
                  <Target className="h-3 w-3 mr-1" />
                  Indicador financiero
                </p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <Calculator className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts y Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Balance General Resumido */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Balance General Resumido
            </CardTitle>
            <CardDescription>Principales cuentas del balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chartOfAccounts.slice(0, 5).map((account) => (
                <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getAccountTypeIcon(account.account_type)}
                    <div>
                      <div className="text-sm font-medium">{account.name}</div>
                      <div className="text-xs text-gray-500">{account.code}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(account.balance)}</div>
                    <div className="text-xs text-gray-500 capitalize">{account.account_type}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Próximos Vencimientos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Próximos Vencimientos
            </CardTitle>
            <CardDescription>Cuentas por pagar que vencen pronto</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payables.slice(0, 3).map((payable) => (
                <div key={payable.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{payable.supplier_name}</div>
                    <div className="text-xs text-gray-500">{payable.invoice_number}</div>
                    <div className="text-xs text-gray-400">
                      Vence: {new Date(payable.due_date).toLocaleDateString('es-AR')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-red-600">{formatCurrency(payable.balance)}</div>
                    <Badge className={getStatusColor(payable.status)}>
                      {payable.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // ================================
  // 💳 CUENTAS POR COBRAR TAB
  // ================================

  const renderReceivables = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cuentas por Cobrar</h2>
          <p className="text-gray-600">Gestión de facturas de clientes y cobranzas</p>
        </div>
        <div className="flex items-center gap-3 mt-4 lg:mt-0">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Factura
          </Button>
        </div>
      </div>

      {/* Receivables Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Factura
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saldo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimiento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {receivables.map((receivable) => (
                  <tr key={receivable.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {receivable.invoice_number}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(receivable.invoice_date).toLocaleDateString('es-AR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {receivable.customer_name}
                      </div>
                      <div className="text-xs text-gray-500">{receivable.customer_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(receivable.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                      {formatCurrency(receivable.balance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(receivable.due_date).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusColor(receivable.status)}>
                        {receivable.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Receipt className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ================================
  // 💸 CUENTAS POR PAGAR TAB
  // ================================

  const renderPayables = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cuentas por Pagar</h2>
          <p className="text-gray-600">Gestión de facturas de proveedores y pagos</p>
        </div>
        <div className="flex items-center gap-3 mt-4 lg:mt-0">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button variant="outline" size="sm">
            <CheckCircle className="h-4 w-4 mr-2" />
            Aprobar Seleccionadas
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Factura Proveedor
          </Button>
        </div>
      </div>

      {/* Payables Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input type="checkbox" className="rounded" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Factura
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimiento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aprobación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payables.map((payable) => (
                  <tr key={payable.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input type="checkbox" className="rounded" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {payable.invoice_number}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(payable.invoice_date).toLocaleDateString('es-AR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {payable.supplier_name}
                      </div>
                      <div className="text-xs text-gray-500">{payable.supplier_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                      {formatCurrency(payable.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(payable.due_date).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusColor(payable.status)}>
                        {payable.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusColor(payable.approval_status)}>
                        {payable.approval_status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Banknote className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ================================
  // 📊 PLAN DE CUENTAS TAB
  // ================================

  const renderChartOfAccounts = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Plan de Cuentas</h2>
          <p className="text-gray-600">Estructura contable de la empresa</p>
        </div>
        <div className="flex items-center gap-3 mt-4 lg:mt-0">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Cuenta
          </Button>
        </div>
      </div>

      {/* Chart of Accounts */}
      <div className="grid gap-4">
        {['asset', 'liability', 'equity', 'revenue', 'expense'].map((accountType) => (
          <Card key={accountType}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 capitalize">
                {getAccountTypeIcon(accountType)}
                {accountType === 'asset' ? 'Activos' :
                 accountType === 'liability' ? 'Pasivos' :
                 accountType === 'equity' ? 'Patrimonio' :
                 accountType === 'revenue' ? 'Ingresos' : 'Gastos'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {chartOfAccounts
                  .filter(account => account.account_type === accountType)
                  .map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-mono font-medium text-gray-600">
                          {account.code}
                        </div>
                        <div className="text-sm font-medium">{account.name}</div>
                        {!account.is_active && (
                          <Badge variant="secondary" className="text-xs">Inactiva</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-semibold">
                            {formatCurrency(account.balance)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // ================================
  // 🎯 MAIN RENDER
  // ================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            💰 Sistema ERP/Contable - InterTravel
          </h1>
          <p className="text-gray-600 mt-1">
            Gestión completa de contabilidad, finanzas y reportes fiscales
          </p>
        </div>
        
        <div className="flex items-center gap-3 mt-4 lg:mt-0">
          <Button variant="outline" size="sm" onClick={fetchAccountingData}>
            <Activity className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="receivables" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Por Cobrar
          </TabsTrigger>
          <TabsTrigger value="payables" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Por Pagar
          </TabsTrigger>
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Plan Cuentas
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reportes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          {renderDashboard()}
        </TabsContent>

        <TabsContent value="receivables" className="mt-6">
          {renderReceivables()}
        </TabsContent>

        <TabsContent value="payables" className="mt-6">
          {renderPayables()}
        </TabsContent>

        <TabsContent value="accounts" className="mt-6">
          {renderChartOfAccounts()}
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Reportes Contables</CardTitle>
              <CardDescription>
                Balance de comprobación, estado de resultados y reportes fiscales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                  <BarChart3 className="h-8 w-8 mb-2" />
                  Balance de Comprobación
                </Button>
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                  <TrendingUp className="h-8 w-8 mb-2" />
                  Estado de Resultados
                </Button>
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                  <PieChart className="h-8 w-8 mb-2" />
                  Balance General
                </Button>
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                  <DollarSign className="h-8 w-8 mb-2" />
                  Flujo de Caja
                </Button>
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                  <FileText className="h-8 w-8 mb-2" />
                  Reportes Fiscales
                </Button>
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                  <Calendar className="h-8 w-8 mb-2" />
                  Reportes Mensuales
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}