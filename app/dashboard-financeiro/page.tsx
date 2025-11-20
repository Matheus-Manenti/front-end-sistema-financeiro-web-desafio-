'use client'

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

const mockClientes = [
  { id: 1, nome: 'João Silva', email: 'joao@email.com', telefone: '(11) 98765-4321', status: 'Adimplente' },
  { id: 2, nome: 'Maria Santos', email: 'maria@email.com', telefone: '(11) 98765-4322', status: 'Adimplente' },
  { id: 3, nome: 'Pedro Oliveira', email: 'pedro@email.com', telefone: '(11) 98765-4323', status: 'Pendente' },
  { id: 4, nome: 'Ana Costa', email: 'ana@email.com', telefone: '(11) 98765-4324', status: 'Adimplente' },
  { id: 5, nome: 'Carlos Souza', email: 'carlos@email.com', telefone: '(11) 98765-4325', status: 'Pendente' },
]

const chartData = [
  { mes: 'Jan', recebido: 45000, pagar: 32000 },
  { mes: 'Fev', recebido: 52000, pagar: 35000 },
  { mes: 'Mar', recebido: 48000, pagar: 38000 },
  { mes: 'Abr', recebido: 61000, pagar: 42000 },
  { mes: 'Mai', recebido: 55000, pagar: 39000 },
  { mes: 'Jun', recebido: 67000, pagar: 45000 },
]

const statusData = [
  { name: 'Adimplente', value: 3, color: '#10b981' },
  { name: 'Pendente', value: 2, color: '#ef4444' },
]

export default function DashboardFinanceiro() {
  const clientesAtivos = mockClientes.filter(c => c.status === 'Adimplente').length
  const clientesPendentes = mockClientes.filter(c => c.status === 'Pendente').length
  const totalRecebido = 67000
  const totalPagar = 45000

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-balance">Dashboard Financeiro</h1>
          <p className="text-muted-foreground mt-2">Visão geral dos indicadores financeiros</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clientesAtivos}</div>
              <p className="text-xs text-muted-foreground mt-1">Total de clientes adimplentes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clientesPendentes}</div>
              <p className="text-xs text-muted-foreground mt-1">Clientes inadimplentes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recebido (Mês)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {totalRecebido.toLocaleString('pt-BR')}</div>
              <p className="text-xs text-muted-foreground mt-1">Receita do mês atual</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {totalPagar.toLocaleString('pt-BR')}</div>
              <p className="text-xs text-muted-foreground mt-1">Despesas pendentes</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Receitas vs Despesas</CardTitle>
              <CardDescription>Comparativo dos últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="recebido" fill="hsl(var(--chart-1))" name="Recebido" />
                  <Bar dataKey="pagar" fill="hsl(var(--chart-4))" name="A Pagar" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status dos Clientes</CardTitle>
              <CardDescription>Distribuição por adimplência</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Clientes Ativos</CardTitle>
            <CardDescription>Lista de todos os clientes cadastrados</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockClientes.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell className="font-medium">{cliente.nome}</TableCell>
                    <TableCell>{cliente.email}</TableCell>
                    <TableCell>{cliente.telefone}</TableCell>
                    <TableCell>
                      <Badge variant={cliente.status === 'Adimplente' ? 'default' : 'destructive'}>
                        {cliente.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
