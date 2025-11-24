
'use client'

import { useState, useEffect, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
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
import { Plus, Pencil, Power } from 'lucide-react'
import { getAllUsers, getAllClients, createUser, updateUser, toggleUserStatus } from '@/lib/api'

type Usuario = {
  id: number
  nome: string
  email: string
  papel: string
  ativo: boolean
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export default function UsuariosPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('userRole') ?? ''
      const normalized = raw.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_')
      if (normalized) {
        setUserRole(normalized)
        return
      }
      
      const token = localStorage.getItem('token')
      try {
        if (token) {
          const parts = token.split('.')
          if (parts.length > 1) {
            const payload = parts[1]
            const json = JSON.parse(atob(payload))
            const candidate = json.role || json.roles || json.papel || (json.user && json.user.role)
            if (candidate) {
              const fromToken = String(candidate).trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_')
              setUserRole(fromToken)
              return
            }
          }
        }
      } catch (e) {
       
      }
      setUserRole(null)
    }
  }, [])

  

  useEffect(() => {
   
    const fetchUsuarios = async () => {
      try {
        const data = await getAllUsers()
        const loggedEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
        const mapped = data
          .filter((u: any) => u.email !== loggedEmail && (u.role === 'ADMIN' || u.role === 'USER'))
          .map((u: any) => ({
            id: u.id,
            nome: u.name,
            email: u.email,
            papel: u.role,
            ativo: u.isActive,
          }))
        setUsuarios(mapped)
      } catch (error) {
        console.error('Erro ao buscar usuários:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchUsuarios()
  }, [router])

  const [isOpen, setIsOpen] = useState(false)
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null)
  const [formData, setFormData] = useState({ nome: '', email: '', papel: 'USER', senha: '' })
  const [addError, setAddError] = useState<string | null>(null)
  const [emailChecking, setEmailChecking] = useState(false)
  const [emailDuplicate, setEmailDuplicate] = useState(false)

  // Debounced validation: check if email exists in users or clients while typing
  useEffect(() => {
    const email = formData.email?.toLowerCase?.().trim?.();
    if (!email) {
      setEmailDuplicate(false)
      setEmailChecking(false)
      return
    }

    setEmailChecking(true)
    const handler = setTimeout(async () => {
      try {
        const [allUsers, allClients] = await Promise.all([getAllUsers(), getAllClients()])
        const existsInUsers = allUsers.some((u: any) => String(u.email).toLowerCase() === email && (!editingUsuario || String(u.id) !== String(editingUsuario.id)))
        const existsInClients = allClients.some((c: any) => String(c.email).toLowerCase() === email)
        setEmailDuplicate(existsInUsers || existsInClients)
      } catch (e) {
        // on error, don't mark duplicate but stop checking
        setEmailDuplicate(false)
      } finally {
        setEmailChecking(false)
      }
    }, 500)

    return () => clearTimeout(handler)
  }, [formData.email, editingUsuario])

  const handleAddOrEdit = async () => {
    setAddError(null);
    if (editingUsuario) {
      try {
          // Validação: não permitir atualizar para um email que já existe em outro usuário ou em clientes
          const emailToCheck = formData.email?.toLowerCase?.().trim();
          if (!emailToCheck) {
            setAddError('Email é obrigatório.');
            return;
          }
          try {
            const [allUsers, allClients] = await Promise.all([getAllUsers(), getAllClients()]);
            const emailExistsInUsers = allUsers.some((u: any) => String(u.email).toLowerCase() === emailToCheck && String(u.id) !== String(editingUsuario.id));
            const emailExistsInClients = allClients.some((c: any) => String(c.email).toLowerCase() === emailToCheck);
            if (emailExistsInUsers || emailExistsInClients) {
              setAddError('Este e-mail já está em uso por outro usuário ou cliente.');
              return;
            }
          } catch (err) {
            setAddError('Não foi possível validar e-mail. Tente novamente.');
            return;
          }
        const dadosAtualizados = {
          name: formData.nome,
          email: formData.email,
          role: formData.papel,
          password: formData.senha,
        };
        await updateUser(String(editingUsuario.id), dadosAtualizados);
        const data = await getAllUsers();
        const loggedEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
        const mapped = data
          .filter((u: any) => u.email !== loggedEmail && (u.role === 'ADMIN' || u.role === 'USER'))
          .map((u: any) => ({
            id: u.id,
            nome: u.name,
            email: u.email,
            papel: u.role,
            ativo: u.isActive,
          }));
        setUsuarios(mapped);
        setIsOpen(false);
        setFormData({ nome: '', email: '', papel: 'USER', senha: '' });
        setEditingUsuario(null);
      } catch (error: any) {
        setAddError('Erro ao editar usuário. Tente novamente.');
      }
    } else {
      try {
          // Validação: não permitir criar usuário com email já existente em users ou clients
          const emailToCheck = formData.email?.toLowerCase?.().trim();
          if (!emailToCheck) {
            setAddError('Email é obrigatório.');
            return;
          }
          try {
            const [allUsers, allClients] = await Promise.all([getAllUsers(), getAllClients()]);
            const emailExistsInUsers = allUsers.some((u: any) => String(u.email).toLowerCase() === emailToCheck);
            const emailExistsInClients = allClients.some((c: any) => String(c.email).toLowerCase() === emailToCheck);
            if (emailExistsInUsers || emailExistsInClients) {
              setAddError('Este e-mail já está em uso por outro usuário ou cliente.');
              return;
            }
          } catch (err) {
            // Se falhar ao validar (erro de rede), bloqueamos criação por segurança
            setAddError('Não foi possível validar e-mail. Tente novamente.');
            return;
          }
        const novoUsuario = {
          name: formData.nome,
          email: formData.email,
          password: formData.senha,
          role: formData.papel,
        };
        const usuarioCriado = await createUser(novoUsuario);
        const loggedEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
        setUsuarios((prevUsuarios) => [
          {
            id: usuarioCriado.id,
            nome: usuarioCriado.name,
            email: usuarioCriado.email,
            papel: usuarioCriado.role,
            ativo: usuarioCriado.isActive,
          },
          ...prevUsuarios,
        ].filter((u) => u.email !== loggedEmail && (u.papel === 'ADMIN' || u.papel === 'USER')));
        setIsOpen(false);
        setFormData({ nome: '', email: '', papel: 'USER', senha: '' });
        setEditingUsuario(null);
      } catch (error: any) {
        setAddError('Erro ao criar usuário. Tente novamente.');
      }
    }
  }

  const handleEdit = (usuario: Usuario) => {
    setEditingUsuario(usuario)
    setFormData({ nome: usuario.nome, email: usuario.email, papel: usuario.papel, senha: '' })
    setIsOpen(true)
  }

  const handleToggleStatus = async (id: number) => {
    try {
      await toggleUserStatus(String(id));
      setUsuarios((prevUsuarios) => {
        const updatedList = prevUsuarios.map((usuario) =>
          usuario.id === id
            ? { ...usuario, ativo: !usuario.ativo }
            : usuario
        );
      
        return updatedList.sort((a, b) => (a.ativo === b.ativo ? 0 : a.ativo ? -1 : 1));
      });
    } catch (error) {
      console.error('Erro ao alternar status do usuário:', error);
    }
  }

  const getPapelColor = (papel: string) => {
    switch (papel) {
      case 'SUPER_ADMIN':
        return 'destructive'
      case 'ADMIN':
        return 'default'
      default:
        return 'secondary'
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-balance">Dashboard de Usuários</h1>
              <p className="text-muted-foreground mt-2">Gerenciamento de todos os usuários</p>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingUsuario(null)
                  setFormData({ nome: '', email: '', papel: 'USER', senha: '' })
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Usuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingUsuario ? 'Editar Usuário' : 'Adicionar Usuário'}</DialogTitle>
                  <DialogDescription>
                    {editingUsuario ? 'Atualize as informações do usuário.' : 'Preencha os dados do novo usuário.'}
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
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        setFormData({ ...formData, email: e.target.value })
                        setEmailDuplicate(false)
                      }}
                      placeholder="email@exemplo.com"
                    />
                    <p className="text-sm mt-1">
                      {emailChecking && <span className="text-amber-600">Verificando email...</span>}
                      {!emailChecking && emailDuplicate && <span className="text-red-600">Este e-mail já está em uso por outro usuário ou cliente.</span>}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="papel">Papel</Label>
                    <select
                      id="papel"
                      value={formData.papel}
                      onChange={(e) => setFormData({ ...formData, papel: e.target.value })}
                      className="w-full border rounded px-2 py-1"
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="senha">Senha</Label>
                    <Input
                      id="senha"
                      type="password"
                      value={formData.senha}
                      onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                {addError && (
                  <p className="text-sm text-center text-red-600">{addError}</p>
                )}
                <DialogFooter>
                  <Button onClick={handleAddOrEdit} disabled={emailChecking || emailDuplicate}>
                    {editingUsuario ? 'Salvar' : 'Adicionar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Input
            type="text"
            placeholder="Pesquisar usuário..."
            className="w-full mb-4"
            onChange={(e) => {
              const searchTerm = e.target.value.toLowerCase();
              if (searchTerm === '') {
                const fetchUsuarios = async () => {
                  try {
                    const data = await getAllUsers();
                    const mapped = data.map((u: any) => ({
                      id: u.id,
                      nome: u.name,
                      email: u.email,
                      papel: u.role,
                      ativo: u.isActive,
                    }));
                    setUsuarios(mapped);
                  } catch (error) {
                    console.error('Erro ao buscar usuários:', error);
                  }
                };
                fetchUsuarios();
              } else {
                setUsuarios((prevUsuarios) =>
                  prevUsuarios.filter((usuario) =>
                    usuario.nome.toLowerCase().includes(searchTerm)
                  )
                );
              }
            }}
          />

          <Card>
            <CardHeader>
              <CardTitle>Lista de Usuários</CardTitle>
              <CardDescription>Visualize e gerencie todos os usuários cadastrados</CardDescription>
            </CardHeader>
            <CardContent>
              <Table className="mx-auto text-center">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Nome</TableHead>
                    <TableHead className="text-center">Email</TableHead>
                    <TableHead className="text-center">Papel</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.map((usuario) => (
                    <TableRow key={usuario.id} className="text-center">
                      <TableCell className="text-center font-medium">{usuario.nome}</TableCell>
                      <TableCell className="text-center">{usuario.email}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getPapelColor(usuario.papel)}>
                          {usuario.papel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={usuario.ativo ? 'default' : 'secondary'}>
                          {usuario.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(usuario)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={usuario.ativo ? 'destructive' : 'default'}
                            size="sm"
                            onClick={() => handleToggleStatus(usuario.id)}
                            disabled={usuario.papel === 'SUPER_ADMIN'}
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
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

