'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { DashboardLayout } from '@/components/dashboard-layout'
import axios from 'axios'

type Cliente = {
  id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  status: 'ADIMPLENTE' | 'INADIMPLENTE';
};

export default function DashboardFinanceiro() {
        
        const [valorTotalPago, setValorTotalPago] = React.useState<number | null>(null);
        const [valorTotalAPagar, setValorTotalAPagar] = React.useState<number | null>(null);
        const [valorRecebidoMesAtual, setValorRecebidoMesAtual] = React.useState<number | null>(null);
        const [loadingFinanceiro, setLoadingFinanceiro] = React.useState(true);
        const [erroFinanceiro, setErroFinanceiro] = React.useState<string | null>(null);

        React.useEffect(() => {

            setLoadingFinanceiro(true);
            setErroFinanceiro(null);
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

            async function fetchWithFallback(path: string) {
              const headers = { Authorization: token ? `Bearer ${token}` : '' };
              const candidates = [path, `http://localhost:3000${path}`];
              let lastError: any = null;
              for (const candidate of candidates) {
                try {
                      const res = await axios.get(candidate, { headers });
                  return res;
                } catch (err: any) {
                  lastError = err;
                }
              }
              throw lastError;
            }

            (async () => {
              try {
                const res = await fetchWithFallback('/api/orders/list-all');
                const orders = res?.data ?? [];

                let totalPaid = 0;
                let totalUnpaid = 0;
                let receivedThisMonth = 0;
                const now = new Date();

                for (const o of orders) {
                  const isPaid = o?.isPaid ?? o?.is_paid ?? o?.paid ?? false;
                  const value = Number(o?.value ?? o?.amount ?? o?.total ?? o?.price ?? 0) || 0;

                  if (isPaid) totalPaid += value; else totalUnpaid += value;

                  const dateStr = o?.paidAt ?? o?.paid_at ?? o?.createdAt ?? o?.created_at ?? o?.date;
                  const date = dateStr ? new Date(dateStr) : null;
                  if (isPaid && date instanceof Date && !isNaN(date.getTime())) {
                    if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
                      receivedThisMonth += value;
                    }
                  }
                }

                setValorTotalPago(totalPaid);
                setValorTotalAPagar(totalUnpaid);
                setValorRecebidoMesAtual(receivedThisMonth);
              } catch (err: any) {
                console.error('fetchFinanceiroFromListAll error:', err);
                const msg = err?.response?.data?.message || err?.message || 'Erro ao buscar dados financeiros.';
                setErroFinanceiro(msg);
                setValorTotalPago(0);
                setValorTotalAPagar(0);
                setValorRecebidoMesAtual(0);
              } finally {
                setLoadingFinanceiro(false);
              }
            })();
        }, []);
      const [clientes, setClientes] = React.useState<Cliente[]>([]);
      const [loadingClientes, setLoadingClientes] = React.useState(true);
      const {
        totalClientes,
        adimplentes,
        inadimplentes,
        percentAdimplente,
        percentInadimplente
      } = React.useMemo(() => {
        const total = clientes.length;
        const adimp = clientes.filter(c => c.status === 'ADIMPLENTE').length;
        const inadimp = total - adimp;
        return {
          totalClientes: total,
          adimplentes: adimp,
          inadimplentes: inadimp,
          percentAdimplente: total > 0 ? ((adimp / total) * 100).toFixed(1) : 0,
          percentInadimplente: total > 0 ? ((inadimp / total) * 100).toFixed(1) : 0
        };
      }, [clientes]);

      React.useEffect(() => {
        async function fetchClientes() {
          try {
            const { getAllClients } = await import('@/lib/api');
            const data = await getAllClients();
            const mapped = data.map((c: any) => ({
              id: c.id,
              name: c.name,
              email: c.email,
              phone: c.phone,
              isActive: c.isActive,
              status: c.status || c.financialStatus || 'ADIMPLENTE',
            }));
            setClientes(mapped);
          } catch (error) {
            console.error('Erro ao buscar clientes:', error);
          } finally {
            setLoadingClientes(false);
          }
        }
        fetchClientes();
      }, []);

  return (
    <DashboardLayout>
        <div>
          <h1 className="text-3xl font-bold text-balance">Dashboard Financeiro</h1>
          <p className="text-muted-foreground mt-2">Gerenciamento Financeiro</p>
        </div>
        <br />
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clientes.length}</div>
              <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Total de clientes ativos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total já pago</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingFinanceiro ? 'Carregando...' : erroFinanceiro ? erroFinanceiro : `R$ ${valorTotalPago?.toLocaleString('pt-BR')}`}
              </div>
              <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Histórico completo de pagamentos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total recebido (mês atual)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingFinanceiro ? 'Carregando...' : erroFinanceiro ? erroFinanceiro : `R$ ${valorRecebidoMesAtual?.toLocaleString('pt-BR')}`}
              </div>
              <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Receita do mês atual</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total a pagar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingFinanceiro ? 'Carregando...' : erroFinanceiro ? erroFinanceiro : `R$ ${valorTotalAPagar?.toLocaleString('pt-BR')}`}
              </div>
              <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Despesas pendentes</p>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
      
      </div>
      <br />

      <Card>
            <CardHeader>
              <CardTitle>Status dos Clientes</CardTitle>
              <CardDescription>Distribuição por adimplência</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="text-sm text-primary">Adimplente: {percentAdimplente}%</div>
                </div>
                <div style={{ width: 250, height: 250 }} className="relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[{ name: 'Adimplente', value: adimplentes, fill: '#163A75' }, { name: 'Inadimplente', value: inadimplentes, fill: '#ef4444' }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={80}
                        startAngle={90}
                        endAngle={-270}
                        cornerRadius={8}
                        paddingAngle={2}
                        dataKey="value"
                        label={false}
                        labelLine={false}
                      >
                        <Cell key="adimplente" fill="#163A75" />
                        <Cell key="inadimplente" fill="#ef4444" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="mt-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#163A75' }} />
                      <div className="text-sm">
                        <div className="font-medium">Adimplente</div>
                        <div className="text-xs text-muted-foreground">{percentAdimplente}%</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }} />
                      <div className="text-sm">
                        <div className="font-medium">Inadimplente</div>
                        <div className="text-xs text-muted-foreground">{percentInadimplente}%</div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <div className="text-lg font-semibold" style={{ color: '#163A75' }}>{percentAdimplente}%</div>
                      <div className="text-xs text-muted-foreground">Adimplente</div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-destructive">Inadimplente: {percentInadimplente}%</div>
                </div>
              </div>
            </CardContent>
          </Card>
      <br />
      <Card>
        <CardHeader>
          <CardTitle>Clientes Ativos</CardTitle>
          <CardDescription>Lista de todos os clientes cadastrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Nome</TableHead>
                  <TableHead className="text-center">Email</TableHead>
                  <TableHead className="text-center">Telefone</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {clientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>Nenhum cliente encontrado.</TableCell>
                </TableRow>
              ) : (
                clientes.map((cliente) => (
                  <TableRow key={cliente.id}>
                      <TableCell className="font-medium text-center">{cliente.name}</TableCell>
                      <TableCell className="text-center">{cliente.email}</TableCell>
                      <TableCell className="text-center">{cliente.phone}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={cliente.status === 'ADIMPLENTE' ? 'default' : 'destructive'}>
                          {cliente.status === 'ADIMPLENTE' ? 'Adimplente' : 'Inadimplente'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                ))
              )}
            </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
