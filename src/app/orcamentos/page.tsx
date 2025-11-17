"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Clock, CheckCircle, XCircle, Trash2, Filter, RotateCcw } from "lucide-react"
import Link from "next/link"

interface Quote {
  id: string
  clientName: string
  sellerName: string
  total: number
  status: "open" | "closed" | "cancelled"
  createdAt: string
  productsCount: number
}

interface Cliente {
  id: string
  nome: string
}

interface Vendedor {
  id: string
  nome: string
}

interface Produto {
  id: string
  nome: string
  preco: number
}

interface ItemPedido {
  produtoId: string
  quantidade: number
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [search, setSearch] = useState("")
  const [openCreate, setOpenCreate] = useState(false)
  const [formData, setFormData] = useState({
    clienteId: "",
    vendedorId: "",
    observacoes: "",
  })
  const [itens, setItens] = useState<ItemPedido[]>([])
  const [currentItem, setCurrentItem] = useState({ produtoId: "", quantidade: 1 })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadQuotes()
    loadClientes()
    loadVendedores()
    loadProdutos()
  }, [])

  async function loadQuotes() {
    const res = await fetch("/api/orcamentos")
    const data = await res.json()
    setQuotes(data)
  }

  async function loadClientes() {
    const res = await fetch("/api/clientes")
    const data = await res.json()
    const clientesFormatados = data.map((c: any) => ({ id: c.id, nome: c.name }))
    setClientes(clientesFormatados)
  }

  async function loadVendedores() {
    const res = await fetch("/api/vendedores")
    const data = await res.json()
    setVendedores(data)
  }

  async function loadProdutos() {
    const res = await fetch("/api/produtos")
    const data = await res.json()
    const produtosFormatados = data.map((p: any) => ({
      id: p.id,
      nome: p.name,
      preco: p.price,
    }))
    setProdutos(produtosFormatados)
  }

  function addItem() {
    if (!currentItem.produtoId || currentItem.quantidade <= 0) {
      alert("Selecione um produto e quantidade válida")
      return
    }

    setItens([...itens, { ...currentItem }])
    setCurrentItem({ produtoId: "", quantidade: 1 })
  }

  function removeItem(index: number) {
    setItens(itens.filter((_, i) => i !== index))
  }

  function calculateTotal() {
    return itens.reduce((acc, item) => {
      const produto = produtos.find(p => p.id === item.produtoId)
      return acc + (produto ? produto.preco * item.quantidade : 0)
    }, 0)
  }

  async function handleCreateQuote() {
    if (!formData.clienteId || !formData.vendedorId || itens.length === 0) {
      alert("Preencha todos os campos obrigatórios e adicione pelo menos um produto")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/orcamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          itens,
        }),
      })

      if (res.ok) {
        setFormData({ clienteId: "", vendedorId: "", observacoes: "" })
        setItens([])
        setOpenCreate(false)
        loadQuotes()
      } else {
        const error = await res.json()
        alert(error.error || "Erro ao criar orçamento")
      }
    } catch (error) {
      console.error("Erro:", error)
      alert("Erro ao criar orçamento")
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateStatus(id: string, newStatus: string) {
    try {
      const res = await fetch(`/api/orcamentos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        loadQuotes()
      } else {
        alert("Erro ao atualizar status")
      }
    } catch (error) {
      console.error("Erro:", error)
      alert("Erro ao atualizar status")
    }
  }

  async function handleCancelQuote(id: string) {
    if (!confirm("Tem certeza que deseja cancelar este orçamento?")) return

    try {
      const res = await fetch(`/api/orcamentos/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        loadQuotes()
      } else {
        alert("Erro ao cancelar orçamento")
      }
    } catch (error) {
      console.error("Erro:", error)
      alert("Erro ao cancelar orçamento")
    }
  }

  const filtered = quotes.filter(
    (q) =>
      q.clientName.toLowerCase().includes(search.toLowerCase()) ||
      q.sellerName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-secondary/10 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Orçamentos e Pedidos</h1>
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Orçamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo Orçamento</DialogTitle>
                <DialogDescription>Crie um novo orçamento para um cliente</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Cliente *</label>
                    <select
                      className="w-full px-3 py-2 border rounded-md"
                      value={formData.clienteId}
                      onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
                    >
                      <option value="">Selecione um cliente</option>
                      {clientes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Vendedor *</label>
                    <select
                      className="w-full px-3 py-2 border rounded-md"
                      value={formData.vendedorId}
                      onChange={(e) => setFormData({ ...formData, vendedorId: e.target.value })}
                    >
                      <option value="">Selecione um vendedor</option>
                      {vendedores.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Observações</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md min-h-[60px]"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Observações sobre o orçamento..."
                  />
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Produtos</h3>
                  <div className="grid grid-cols-12 gap-2 mb-3">
                    <div className="col-span-7">
                      <select
                        className="w-full px-3 py-2 border rounded-md"
                        value={currentItem.produtoId}
                        onChange={(e) => setCurrentItem({ ...currentItem, produtoId: e.target.value })}
                      >
                        <option value="">Selecione um produto</option>
                        {produtos.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nome} - R$ {p.preco.toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        min="1"
                        placeholder="Qtd"
                        value={currentItem.quantidade}
                        onChange={(e) =>
                          setCurrentItem({ ...currentItem, quantidade: parseInt(e.target.value) || 1 })
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <Button onClick={addItem} className="w-full">
                        Adicionar
                      </Button>
                    </div>
                  </div>

                  {itens.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {itens.map((item, index) => {
                        const produto = produtos.find(p => p.id === item.produtoId)
                        return (
                          <div
                            key={index}
                            className="flex justify-between items-center p-3 bg-secondary/10 rounded-md"
                          >
                            <div>
                              <p className="font-medium">{produto?.nome}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.quantidade}x R$ {produto?.preco.toFixed(2)} = R${" "}
                                {((produto?.preco || 0) * item.quantidade).toFixed(2)}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(index)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      })}
                      <div className="flex justify-between items-center p-3 bg-primary/10 rounded-md font-bold">
                        <span>TOTAL:</span>
                        <span className="text-xl">R$ {calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleCreateQuote}
                    disabled={saving || !formData.clienteId || !formData.vendedorId || itens.length === 0}
                    className="flex-1"
                  >
                    {saving ? "Salvando..." : "Criar Orçamento"}
                  </Button>
                  <Button variant="outline" onClick={() => setOpenCreate(false)} disabled={saving}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente ou vendedor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="all" className="gap-2">
              <Filter className="h-4 w-4" />
              Todos ({filtered.length})
            </TabsTrigger>
            <TabsTrigger value="open" className="gap-2">
              <Clock className="h-4 w-4" />
              Abertos ({filtered.filter(q => q.status === 'open').length})
            </TabsTrigger>
            <TabsTrigger value="closed" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Fechados ({filtered.filter(q => q.status === 'closed').length})
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="gap-2">
              <XCircle className="h-4 w-4" />
              Cancelados ({filtered.filter(q => q.status === 'cancelled').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum orçamento encontrado</p>
              </div>
            ) : (
              filtered.map((quote) => (
                <QuoteCard key={quote.id} quote={quote} onUpdateStatus={handleUpdateStatus} onCancel={handleCancelQuote} />
              ))
            )}
          </TabsContent>

          <TabsContent value="open" className="space-y-4">
            {filtered.filter(q => q.status === 'open').length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum orçamento aberto</p>
              </div>
            ) : (
              filtered.filter(q => q.status === 'open').map((quote) => (
                <QuoteCard key={quote.id} quote={quote} onUpdateStatus={handleUpdateStatus} onCancel={handleCancelQuote} />
              ))
            )}
          </TabsContent>

          <TabsContent value="closed" className="space-y-4">
            {filtered.filter(q => q.status === 'closed').length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum orçamento fechado</p>
              </div>
            ) : (
              filtered.filter(q => q.status === 'closed').map((quote) => (
                <QuoteCard key={quote.id} quote={quote} onUpdateStatus={handleUpdateStatus} onCancel={handleCancelQuote} />
              ))
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-4">
            {filtered.filter(q => q.status === 'cancelled').length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum orçamento cancelado</p>
              </div>
            ) : (
              filtered.filter(q => q.status === 'cancelled').map((quote) => (
                <QuoteCard key={quote.id} quote={quote} onUpdateStatus={handleUpdateStatus} onCancel={handleCancelQuote} />
              ))
            )}
          </TabsContent>
        </Tabs>

        <Link href="/dashboard">
          <Button variant="outline" className="mt-8">
            Voltar
          </Button>
        </Link>
      </div>
    </main>
  )
}

function QuoteCard({ 
  quote, 
  onUpdateStatus, 
  onCancel 
}: { 
  quote: Quote
  onUpdateStatus: (id: string, status: string) => void
  onCancel: (id: string) => void
}) {
  const router = useRouter()

  return (
    <Card 
      className="hover:shadow-lg transition-shadow border-2 cursor-pointer"
      onClick={() => router.push(`/orcamentos/${quote.id}`)}
    >
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="font-bold text-xl mb-1">{quote.clientName}</h3>
            <p className="text-sm text-muted-foreground">Vendedor: {quote.sellerName}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-2">
              <Clock className="h-4 w-4" />
              {new Date(quote.createdAt).toLocaleDateString("pt-BR")}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{quote.productsCount} produto(s)</p>
          </div>
          <div className="text-right space-y-3">
            <div className="text-3xl font-bold text-primary">
              R$ {quote.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <span
              className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                quote.status === "open" 
                  ? "bg-yellow-500 text-white"
                  : quote.status === "closed"
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              {quote.status === "open" ? "Aberto" : quote.status === "closed" ? "Fechado" : "Cancelado"}
            </span>
          </div>
        </div>
        
        {/* Botões para orçamento ABERTO */}
        {quote.status === "open" && (
          <div className="flex gap-3 pt-4 border-t-2 border-dashed" onClick={(e) => e.stopPropagation()}>
            <Button
              size="lg"
              onClick={() => onUpdateStatus(quote.id, "closed")}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Fechar Pedido
            </Button>
            <Button
              size="lg"
              variant="destructive"
              onClick={() => onCancel(quote.id)}
              className="font-bold"
            >
              <XCircle className="h-5 w-5 mr-2" />
              Cancelar
            </Button>
          </div>
        )}

        {/* Botão de REABRIR para orçamentos fechados ou cancelados */}
        {(quote.status === "closed" || quote.status === "cancelled") && (
          <div className="flex gap-3 pt-4 border-t-2 border-dashed" onClick={(e) => e.stopPropagation()}>
            <Button
              size="lg"
              onClick={() => {
                if (confirm("Tem certeza que deseja reabrir este orçamento?")) {
                  onUpdateStatus(quote.id, "open")
                }
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Reabrir Orçamento
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}