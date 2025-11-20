'use client'

import { useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Plus, Pencil, Power } from 'lucide-react'

type Usuario = {
  id: number
  nome: string
  email: string
  papel: 'SUPER_ADMIN' | 'ADMIN' | 'USER'
  ativo: boolean
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([
    { id: 1, nome: 'Super Admin', email: 'super@admin.com', papel: 'SUPER_ADMIN', ativo: true },
    { id: 2, nome: 'Admin Silva', email: 'admin@sistema.com', papel: 'ADMIN', ativo: true },
    { id: 3, nome: 'João Usuário', email: 'joao@user.com', papel: 'USER', ativo: true },
    { id: 4, nome: 'Maria Operadora', email: 'maria@user.com', papel: 'USER', ativo: true },
    { id: 5, nome: 'Pedro Antigo', email: 'pedro@user.com', papel: 'USER', ativo: false },
  ])

  const [isOpen, setIsOpen] = useState(false)
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null)
  const [formData, setFormData] = useState({ nome: '', email: '', papel: 'USER' as Usuario['papel'], senha: '' })

  const handleAddOrEdit = () => {
    if (editingUsuario) {
      setUsuarios(usuarios.map(u => 
        u.id === editingUsuario.id 
          ? { ...u, nome: formData.nome, email: formData.email, papel: formData.papel }
          : u
      ))
    } else {
      const newUsuario: Usuario = {
        id: usuarios.length + 1,
        nome: formData.nome,
        email: formData.email,
        papel: formData.papel,
        ativo: true,
      }
      setUsuarios([...usuarios, newUsuario])
    }
    setIsOpen(false)
    setFormData({ nome: '', email: '', papel: 'USER', senha: '' })
    setEditingUsuario(null)
  }

  const handleEdit = (usuario: Usuario) => {
    setEditingUsuario(usuario)
    setFormData({ nome: usuario.nome, email: usuario.email, papel: usuario.papel, senha: '' })
    setIsOpen(true)
  }

  const handleToggleStatus = (id: number) => {
    setUsuarios(usuarios.map(u => 
      u.id === id ? { ...u, ativo: !u.ativo } : u
    ))
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
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-balance">Gerenciar Usuários</h1>
            <p className="text-muted-foreground mt-2">Controle de usuários e permissões do sistema</p>
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
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="papel">Papel</Label>
                  <Select value={formData.papel} onValueChange={(value: Usuario['papel']) => setFormData({ ...formData, papel: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o papel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">USER</SelectItem>
                      <SelectItem value="ADMIN">ADMIN</SelectItem>
                      <SelectItem value="SUPER_ADMIN">SUPER_ADMIN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {!editingUsuario && (
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
                )}
              </div>
              <DialogFooter>
                <Button onClick={handleAddOrEdit}>
                  {editingUsuario ? 'Salvar' : 'Adicionar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuários</CardTitle>
            <CardDescription>Visualize e gerencie todos os usuários do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell className="font-medium">{usuario.nome}</TableCell>
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell>
                      <Badge variant={getPapelColor(usuario.papel)}>
                        {usuario.papel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={usuario.ativo ? 'default' : 'secondary'}>
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
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
  )
}
