'use client'

import { useState, useEffect } from 'react'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Plus, Pencil, Power, Eye } from 'lucide-react'
import api, { createClient, updateClient, updateClientStatus, toggleOrderPayment, toggleClientFinancialStatus } from '@/lib/api'

type Ordem = {
  id: number
  description: string
  value: number
  startDate: string
  endDate: string
  isPaid: boolean
  startDateFormatted?: string; // Adicionado para suportar datas formatadas
  endDateFormatted?: string; // Adicionado para suportar datas formatadas
}

type Cliente = {
  id: number
  nome: string
  email: string
  telefone: string
  status: string
  ativo: boolean
  statusFinanceiro: string
  orderId?: string // Adicionado para alternar pagamento
  ordens?: Ordem[] // Adicionado para suportar ordens do cliente
}

type FormData = {
  nome: string;
  email: string;
  telefone: string;
  description?: string;
  value?: string;
  startDate?: string;
  endDate?: string;
  isPaid?: boolean;
};

export default function DashboardPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { getAllClients } = await import('@/lib/api')
        const data = await getAllClients()
        // Mapear isActive para ativo, financialStatus para statusFinanceiro e orderId
        const mapped = data.map((c: any) => ({
          id: c.id,
          nome: c.name,
          email: c.email,
          telefone: c.phone,
          status: c.status,
          ativo: c.isActive,
          statusFinanceiro: c.financialStatus,
          orderId: c.orderId,
        }))
        setClientes(mapped)
      } catch (error) {
        console.error('Erro ao buscar clientes:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchClients()
  }, [])

  const [isOpen, setIsOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    email: '',
    telefone: '',
  })
  const [addError, setAddError] = useState<string | null>(null)

  const handleAddOrEdit = async () => {
    setAddError(null);
    if (editingCliente) {
      try {
        const dadosAtualizados = {
          name: formData.nome,
          email: formData.email,
          phone: formData.telefone,
          isActive: editingCliente.ativo,
        };
        await updateClient(String(editingCliente.id), dadosAtualizados);
        const { getAllClients } = await import('@/lib/api');
        const data = await getAllClients();
        const mapped = data.map((c: any) => ({
          id: c.id,
          nome: c.name,
          email: c.email,
          telefone: c.phone,
          status: c.status,
          ativo: c.isActive,
          statusFinanceiro: c.financialStatus,
          orderId: c.orderId,
        }));
        setClientes(mapped);
        setIsOpen(false);
        setFormData({ nome: '', email: '', telefone: '' });
        setEditingCliente(null);
      } catch (error: any) {
        setAddError('Erro ao editar cliente. Tente novamente.');
      }
    } else {
      try {
        const novoCliente = {
          name: formData.nome,
          email: formData.email,
          phone: formData.telefone,
          isActive: true, // Garante que o cliente seja criado como ativo
        };
        const clienteCriado = await createClient(novoCliente);
        setClientes((prevClientes) => {
          const updatedList = [
            {
              id: clienteCriado.id,
              nome: clienteCriado.name,
              email: clienteCriado.email,
              telefone: clienteCriado.phone,
              status: clienteCriado.status,
              ativo: clienteCriado.isActive,
              statusFinanceiro: clienteCriado.financialStatus,
              orderId: clienteCriado.orderId,
            },
            ...prevClientes,
          ];
          // Ordena para manter ativos acima de inativos
          return updatedList.sort((a, b) => (b.ativo ? 1 : 0) - (a.ativo ? 1 : 0));
        });
        setIsOpen(false);
        setFormData({ nome: '', email: '', telefone: '' });
        setEditingCliente(null);
      } catch (error: any) {
        if (error.response?.status === 409) {
          setAddError('Já existe um cliente com este email ou telefone.');
        } else {
          setAddError('Erro ao criar cliente. Tente novamente.');
        }
      }
    }
    setIsOpen(false);
    setFormData({ nome: '', email: '', telefone: '' });
    setEditingCliente(null);
  }

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente)
    setFormData({ 
      nome: cliente.nome, 
      email: cliente.email, 
      telefone: cliente.telefone,
      description: '', // Adiciona os campos necessários para a ordem
      value: '',
      startDate: '',
      endDate: '',
      isPaid: false,
    })
    setIsOpen(true)
  }

  const handleToggleStatus = async (id: number) => {
    try {
      await updateClientStatus(String(id));
      setClientes((prevClientes) => {
        const updatedList = prevClientes.map((cliente) =>
          cliente.id === id
            ? { ...cliente, ativo: !cliente.ativo }
            : cliente
        );
        // Reordena a lista para mover clientes inativos para o final
        return updatedList.sort((a, b) => (a.ativo === b.ativo ? 0 : a.ativo ? -1 : 1));
      });
    } catch (error) {
      console.error('Erro ao alternar status do cliente:', error);
    }
  }

  const handleToggleFinancialStatus = async (id: number) => {
    try {
      const clienteAtualizado = await toggleClientFinancialStatus(String(id));
      setClientes((prevClientes) => {
        // Remove o cliente atualizado da lista
        const filteredList = prevClientes.filter((cliente) => cliente.id !== id);
        // Adiciona o cliente atualizado no final da lista
        return [
          ...filteredList,
          {
            ...clienteAtualizado,
            nome: clienteAtualizado.name,
            email: clienteAtualizado.email,
            telefone: clienteAtualizado.phone,
            status: clienteAtualizado.status,
            ativo: clienteAtualizado.isActive,
            statusFinanceiro: clienteAtualizado.financialStatus,
            orderId: clienteAtualizado.orderId,
          },
        ];
      });
    } catch (error) {
      console.error('Erro ao alternar status financeiro do cliente:', error);
    }
  };

  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [selectedClientOrders, setSelectedClientOrders] = useState<Cliente | null>(null);
  const [isOrdersDialogOpen, setIsOrdersDialogOpen] = useState(false);

  const convertDateToISO = (date: string) => {
    const [day, month, year] = date.split('/');
    return `${year}-${month}-${day}`;
  };

  const formatDateToBrazilian = (date: string) => {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleCreateOrder = async () => {
    try {
      setOrderError(null); // Limpa erros anteriores

      // Log dos dados enviados
      console.log('Dados enviados para criar ordem:', {
        description: formData.description,
        value: formData.value,
        startDate: formData.startDate,
        endDate: formData.endDate,
        isPaid: formData.isPaid,
        clientId: editingCliente?.id,
      });

      if (!formData.description || !formData.value || !formData.startDate || !formData.endDate) {
        throw new Error('Todos os campos são obrigatórios.');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado.');
      }

      const response = await fetch('http://localhost:3000/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: formData.description,
          value: parseFloat(formData.value),
          startDate: convertDateToISO(formData.startDate),
          endDate: convertDateToISO(formData.endDate),
          isPaid: formData.isPaid,
          clientId: editingCliente?.id,
        }),
      });

      // Log da resposta da API
      console.log('Resposta da API:', response);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erro retornado pela API:', errorData);
        throw new Error(errorData.message || 'Erro ao criar ordem');
      }

      const newOrder = await response.json();
      console.log('Nova ordem criada:', newOrder);
      setIsOrderDialogOpen(false);
    } catch (err: any) {
      console.error('Erro ao criar ordem:', err.message);
      setOrderError(err.message);
    }
  };

  const handleViewOrders = async (cliente: Cliente) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado.');
      }

      const response = await fetch(`http://localhost:3000/api/orders/client/${cliente.id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erro ao buscar ordens do cliente:', errorData);
        throw new Error(errorData.message || 'Erro ao buscar ordens');
      }

      const ordens = await response.json();
      setSelectedClientOrders({ ...cliente, ordens });
      setIsOrdersDialogOpen(true);
    } catch (error) {
      console.error('Erro ao buscar ordens do cliente:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-balance">Dashboard de Clientes</h1>
            <p className="text-muted-foreground mt-2">Gerenciamento de todos os clientes</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingCliente(null)
                setFormData({ nome: '', email: '', telefone: '' })
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCliente ? 'Editar Cliente' : 'Adicionar Cliente'}</DialogTitle>
                <DialogDescription>
                  {editingCliente ? 'Atualize as informações do cliente.' : 'Preencha os dados do novo cliente.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
              {addError && (
                <p className="text-sm text-center text-red-600">{addError}</p>
              )}
              {editingCliente && (
                <div className="space-y-2 pt-2">
                  <Label>Status Financeiro</Label>
                  <div className="flex gap-2 items-center">
                    <Badge variant={editingCliente.statusFinanceiro === 'ADIMPLENTE' ? 'default' : 'destructive'}>
                      {editingCliente.statusFinanceiro === 'ADIMPLENTE' ? 'Adimplente' : 'Inadimplente'}
                    </Badge>
                    <Button
                      variant={editingCliente.statusFinanceiro === 'ADIMPLENTE' ? 'outline' : 'destructive'}
                      size="sm"
                      className="transition-transform duration-150 active:scale-95 hover:scale-105 shadow-md"
                      onClick={async () => {
                        const clienteAtualizado = await toggleClientFinancialStatus(String(editingCliente.id));
                        // Buscar o cliente atualizado do banco após alternar
                        const { getAllClients } = await import('@/lib/api');
                        const data = await getAllClients();
                        const mapped = data.map((c: any) => ({
                          id: c.id,
                          nome: c.name,
                          email: c.email,
                          telefone: c.phone,
                          status: c.status,
                          ativo: c.isActive,
                          statusFinanceiro: c.financialStatus,
                          orderId: c.orderId,
                        }));
                        setClientes(mapped);
                        const atualizado = mapped.find((c: any) => c.id === editingCliente.id);
                        if (atualizado) setEditingCliente(atualizado);
                      }}
                      disabled={loading}
                    >
                      {editingCliente.statusFinanceiro === 'ADIMPLENTE' ? 'Marcar como Inadimplente' : 'Confirmar pagamento do cliente'}
                    </Button>
                  </div>
                  {editingCliente.statusFinanceiro !== 'ADIMPLENTE' && (
                    <p className="text-xs text-muted-foreground pt-1">
                      Clique em <b>Confirmar pagamento do cliente</b> para marcar este cliente como adimplente.
                    </p>
                  )}
                  {editingCliente.statusFinanceiro === 'ADIMPLENTE' && (
                    <p className="text-xs text-green-700 pt-1">
                      Este cliente está adimplente. Clique para marcar como inadimplente.
                    </p>
                  )}
                </div>
              )}
              <DialogFooter>
                <Button onClick={handleAddOrEdit}>
                  {editingCliente ? 'Salvar' : 'Adicionar'}
                </Button>
                {editingCliente && (
                  <Button
                    variant="secondary"
                    onClick={() => setIsOrderDialogOpen(true)}
                  >
                    Adicionar Ordem
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Input
          type="text"
          placeholder="Pesquisar cliente..."
          className="w-full mb-4"
          onChange={(e) => {
            const searchTerm = e.target.value.toLowerCase();
            if (searchTerm === '') {
              const fetchClients = async () => {
                try {
                  const { getAllClients } = await import('@/lib/api');
                  const data = await getAllClients();
                  const mapped = data.map((c: any) => ({
                    id: c.id,
                    nome: c.name,
                    email: c.email,
                    telefone: c.phone,
                    status: c.status,
                    ativo: c.isActive,
                    statusFinanceiro: c.financialStatus,
                    orderId: c.orderId,
                  }));
                  setClientes(mapped);
                } catch (error) {
                  console.error('Erro ao buscar clientes:', error);
                }
              };
              fetchClients();
            } else {
              setClientes((prevClientes) =>
                prevClientes.filter((cliente) =>
                  cliente.nome.toLowerCase().includes(searchTerm)
                )
              );
            }
          }}
        />

        <Card>
          <CardHeader>
            <CardTitle>Lista de Clientes</CardTitle>
            <CardDescription>Visualize e gerencie todos os clientes cadastrados</CardDescription>
          </CardHeader>
          <CardContent>
            <Table className="mx-auto text-center">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Nome</TableHead>
                  <TableHead className="text-center">Email</TableHead>
                  <TableHead className="text-center">Telefone</TableHead>
                  <TableHead className="text-center">Ordens</TableHead>
                  <TableHead className="text-center">Status Financeiro</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.map((cliente) => (
                  <TableRow key={cliente.id} className="text-center">
                    <TableCell className="text-center font-medium">{cliente.nome}</TableCell>
                    <TableCell className="text-center">{cliente.email}</TableCell>
                    <TableCell className="text-center">{cliente.telefone}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewOrders(cliente)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={cliente.statusFinanceiro === 'ADIMPLENTE' ? 'default' : 'destructive'}>
                        {cliente.statusFinanceiro === 'ADIMPLENTE' ? 'Adimplente' : 'Inadimplente'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={cliente.ativo ? 'default' : 'secondary'}>
                        {cliente.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(cliente)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={cliente.ativo ? 'destructive' : 'default'}
                          size="sm"
                          onClick={() => handleToggleStatus(cliente.id)}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Ordem</DialogTitle>
              <DialogDescription>Preencha os dados da nova ordem.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição da ordem"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Valor</Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="Valor da ordem"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Data de Início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data de Fim</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            {orderError && <p className="text-sm text-red-600">{orderError}</p>}
            <DialogFooter>
              <Button onClick={handleCreateOrder}>Criar Ordem</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isOrdersDialogOpen} onOpenChange={setIsOrdersDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ordens de {selectedClientOrders?.nome}</DialogTitle>
              <DialogDescription>Visualize e gerencie as ordens deste cliente.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {selectedClientOrders?.ordens?.map((ordem) => (
                <div key={ordem.id} className="border p-4 rounded-md">
                  <p><strong>Descrição:</strong> {ordem.description}</p>
                  <p><strong>Valor:</strong> R$ {ordem.value}</p>
                  <p><strong>Data de Início:</strong> {ordem.startDateFormatted}</p>
                  <p><strong>Data de Fim:</strong> {ordem.endDateFormatted}</p>
                  <p><strong>Status:</strong> {ordem.isPaid ? 'Paga' : 'Não paga'}</p>
                  <Button
                    variant={ordem.isPaid ? 'outline' : 'destructive'}
                    size="sm"
                    onClick={async () => {
                      const updatedClient = await toggleClientFinancialStatus(String(selectedClientOrders?.id));
                      setClientes((prevClientes) => {
                        return prevClientes.map((cliente) =>
                          cliente.id === updatedClient.id
                            ? {
                                ...cliente,
                                statusFinanceiro: updatedClient.financialStatus,
                              }
                            : cliente
                        );
                      });
                      setSelectedClientOrders((prev) => {
                        if (!prev) return prev;
                        const updatedOrders = prev.ordens?.map((o) =>
                          o.id === ordem.id ? { ...o, isPaid: !o.isPaid } : o
                        );
                        return { ...prev, ordens: updatedOrders };
                      });
                    }}
                  >
                    {ordem.isPaid ? 'Marcar como Inadimplente' : 'Confirmar pagamento'}
                  </Button>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

