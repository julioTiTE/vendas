"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Search, Phone, Mail, Edit, Trash2, User } from "lucide-react"
import Link from "next/link"

interface Vendedor {
  id: string
  nome: string
  email: string
  telefone: string
  ativo: boolean
}

export default function VendedoresPage() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [search, setSearch] = useState("")
  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [selectedVendedor, setSelectedVendedor] = useState<Vendedor | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadVendedores()
  }, [])

  async function loadVendedores() {
    const res = await fetch("/api/vendedores")
    const data = await res.json()
    setVendedores(data)
  }

  async function handleCreate() {
    if (!formData.nome || !formData.telefone) {
      alert("Nome e telefone são obrigatórios")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/vendedores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setFormData({ nome: "", email: "", telefone: "" })
        setOpenCreate(false)
        loadVendedores()
      } else {
        alert("Erro ao criar vendedor")
      }
    } catch (error) {
      console.error("Erro:", error)
      alert("Erro ao criar vendedor")
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate() {
    if (!selectedVendedor) return

    if (!formData.nome || !formData.telefone) {
      alert("Nome e telefone são obrigatórios")
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/vendedores/${selectedVendedor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setOpenEdit(false)
        setSelectedVendedor(null)
        loadVendedores()
      } else {
        alert("Erro ao atualizar vendedor")
      }
    } catch (error) {
      console.error("Erro:", error)
      alert("Erro ao atualizar vendedor")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Tem certeza que deseja desativar o vendedor ${nome}?`)) return

    try {
      const res = await fetch(`/api/vendedores/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        loadVendedores()
      } else {
        alert("Erro ao desativar vendedor")
      }
    } catch (error) {
      console.error("Erro:", error)
      alert("Erro ao desativar vendedor")
    }
  }

  function openEditDialog(vendedor: Vendedor) {
    setSelectedVendedor(vendedor)
    setFormData({
      nome: vendedor.nome,
      email: vendedor.email,
      telefone: vendedor.telefone,
    })
    setOpenEdit(true)
  }

  const filtered = vendedores.filter((v) =>
    v.nome.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-secondary/10 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Vendedores</h1>
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Vendedor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Vendedor</DialogTitle>
                <DialogDescription>Preencha os dados do vendedor</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Nome *</label>
                  <Input
                    placeholder="Nome do vendedor"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Telefone *</label>
                  <Input
                    placeholder="(11) 99999-9999"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Email</label>
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={saving || !formData.nome || !formData.telefone}
                  className="w-full"
                >
                  {saving ? "Salvando..." : "Salvar Vendedor"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Dialog de Edição */}
        <Dialog open={openEdit} onOpenChange={setOpenEdit}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Vendedor</DialogTitle>
              <DialogDescription>Atualize as informações do vendedor</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Nome *</label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Telefone *</label>
                <Input
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleUpdate}
                  disabled={saving || !formData.nome || !formData.telefone}
                  className="flex-1"
                >
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </Button>
                <Button variant="outline" onClick={() => setOpenEdit(false)} disabled={saving}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((vendedor) => (
            <Card key={vendedor.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{vendedor.nome}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(vendedor)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(vendedor.id, vendedor.nome)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{vendedor.telefone}</span>
                </div>
                {vendedor.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{vendedor.email}</span>
                  </div>
                )}
                <div className="pt-2">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      vendedor.ativo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {vendedor.ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum vendedor encontrado</p>
          </div>
        )}

        <Link href="/dashboard">
          <Button variant="outline" className="mt-8">
            Voltar
          </Button>
        </Link>
      </div>
    </main>
  )
}