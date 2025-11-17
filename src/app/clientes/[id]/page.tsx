"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowLeft, Phone, Mail, MapPin, Calendar, Package, TrendingUp, Edit } from "lucide-react"

interface Cliente {
  id: string
  nome: string
  telefone: string
  email: string | null
  dataNascimento: string | null
  endereco: string | null
  observacoes: string | null
  ultimaCompraData: string | null
  vendedor: {
    nome: string
  }
  pedidos: Array<{
    id: string
    dataPedido: string
    status: string
    valorTotal: number
    itens: Array<{
      quantidade: number
      produto: {
        nome: string
      }
    }>
  }>
}

export default function ClienteDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    nome: "",
    telefone: "",
    email: "",
    dataNascimento: "",
    endereco: "",
    observacoes: "",
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadCliente()
  }, [params.id])

  async function loadCliente() {
    try {
      const res = await fetch(`/api/clientes/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setCliente(data)
        // Preencher formulário de edição
        setEditForm({
          nome: data.nome,
          telefone: data.telefone,
          email: data.email || "",
          dataNascimento: data.dataNascimento ? data.dataNascimento.split("T")[0] : "",
          endereco: data.endereco || "",
          observacoes: data.observacoes || "",
        })
      }
    } catch (error) {
      console.error("Erro ao carregar cliente:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveEdit() {
    setSaving(true)
    try {
      const res = await fetch(`/api/clientes/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })

      if (res.ok) {
        setEditOpen(false)
        loadCliente() // Recarregar dados
      } else {
        alert("Erro ao salvar alterações")
      }
    } catch (error) {
      console.error("Erro ao salvar:", error)
      alert("Erro ao salvar alterações")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10 flex items-center justify-center">
        <p className="text-lg">Carregando...</p>
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Cliente não encontrado</p>
          <Button onClick={() => router.push("/clientes")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Clientes
          </Button>
        </div>
      </div>
    )
  }

  const totalCompras = cliente.pedidos.filter(p => p.status === "FECHADO").length
  const valorTotal = cliente.pedidos
    .filter(p => p.status === "FECHADO")
    .reduce((acc, p) => acc + Number(p.valorTotal), 0)

  const diasDesdeUltimaCompra = cliente.ultimaCompraData
    ? Math.floor((new Date().getTime() - new Date(cliente.ultimaCompraData).getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-secondary/10 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/clientes")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground">{cliente.nome}</h1>
              <p className="text-muted-foreground">Vendedor: {cliente.vendedor.nome}</p>
            </div>
            <Button onClick={() => setEditOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar Cliente
            </Button>
          </div>
        </div>

        {/* Modal de Edição */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Cliente</DialogTitle>
              <DialogDescription>Atualize as informações do cliente</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Nome *</label>
                <Input
                  value={editForm.nome}
                  onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                  placeholder="Nome do cliente"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Telefone *</label>
                <Input
                  value={editForm.telefone}
                  onChange={(e) => setEditForm({ ...editForm, telefone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Data de Nascimento</label>
                <Input
                  type="date"
                  value={editForm.dataNascimento}
                  onChange={(e) => setEditForm({ ...editForm, dataNascimento: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Endereço</label>
                <Input
                  value={editForm.endereco}
                  onChange={(e) => setEditForm({ ...editForm, endereco: e.target.value })}
                  placeholder="Rua, número, bairro - Cidade"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Observações</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                  value={editForm.observacoes}
                  onChange={(e) => setEditForm({ ...editForm, observacoes: e.target.value })}
                  placeholder="Observações sobre o cliente..."
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSaveEdit}
                  disabled={saving || !editForm.nome || !editForm.telefone}
                  className="flex-1"
                >
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Alertas */}
        {diasDesdeUltimaCompra && diasDesdeUltimaCompra > 30 && (
          <Card className="mb-6 border-l-4 border-destructive bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-destructive font-semibold">
                ⚠️ Cliente sem compras há {diasDesdeUltimaCompra} dias - requer atenção!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Informações principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Compras</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCompras}</div>
              <p className="text-xs text-muted-foreground">
                {cliente.pedidos.filter(p => p.status === "ABERTO").length} orçamento(s) aberto(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Todas as compras</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Última Compra</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {cliente.ultimaCompraData
                  ? new Date(cliente.ultimaCompraData).toLocaleDateString("pt-BR")
                  : "Nunca"}
              </div>
              <p className="text-xs text-muted-foreground">
                {diasDesdeUltimaCompra ? `Há ${diasDesdeUltimaCompra} dias` : "Sem compras"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detalhes de contato */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informações de Contato</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{cliente.telefone}</span>
            </div>
            {cliente.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{cliente.email}</span>
              </div>
            )}
            {cliente.endereco && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{cliente.endereco}</span>
              </div>
            )}
            {cliente.dataNascimento && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  Nascimento: {new Date(cliente.dataNascimento).toLocaleDateString("pt-BR")}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Observações */}
        {cliente.observacoes && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{cliente.observacoes}</p>
            </CardContent>
          </Card>
        )}

        {/* Histórico de Pedidos */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            {cliente.pedidos.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum pedido encontrado
              </p>
            ) : (
              <div className="space-y-4">
                {cliente.pedidos.map((pedido) => (
                  <div
                    key={pedido.id}
                    className="border rounded-lg p-4 hover:bg-secondary/10 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">
                          Pedido #{pedido.id.slice(0, 8)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(pedido.dataPedido).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            pedido.status === "FECHADO"
                              ? "bg-green-100 text-green-800"
                              : pedido.status === "ABERTO"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {pedido.status}
                        </span>
                        <p className="text-lg font-bold mt-1">
                          R$ {Number(pedido.valorTotal).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground mb-1">Produtos:</p>
                      <ul className="text-sm space-y-1">
                        {pedido.itens.map((item, idx) => (
                          <li key={idx}>
                            • {item.quantidade}x {item.produto.nome}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}