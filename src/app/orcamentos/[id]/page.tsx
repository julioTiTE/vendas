"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, Package, Calendar, DollarSign, FileText, CheckCircle, XCircle, RotateCcw } from "lucide-react"

interface Pedido {
  id: string
  dataPedido: string
  status: string
  valorTotal: number
  observacoes: string | null
  cliente: {
    id: string
    nome: string
    telefone: string
    email: string | null
  }
  vendedor: {
    id: string
    nome: string
  }
  itens: Array<{
    id: string
    quantidade: number
    precoUnitario: number
    subtotal: number
    produto: {
      nome: string
      categoria: string
    }
  }>
}

export default function OrcamentoDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPedido()
  }, [params.id])

  async function loadPedido() {
    try {
      const res = await fetch(`/api/orcamentos/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setPedido(data)
      }
    } catch (error) {
      console.error("Erro ao carregar pedido:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateStatus(newStatus: string) {
    try {
      const res = await fetch(`/api/orcamentos/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        loadPedido()
      } else {
        alert("Erro ao atualizar status")
      }
    } catch (error) {
      console.error("Erro:", error)
      alert("Erro ao atualizar status")
    }
  }

  async function handleCancel() {
    if (!confirm("Tem certeza que deseja cancelar este orçamento?")) return

    try {
      const res = await fetch(`/api/orcamentos/${params.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        loadPedido()
      } else {
        alert("Erro ao cancelar orçamento")
      }
    } catch (error) {
      console.error("Erro:", error)
      alert("Erro ao cancelar orçamento")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10 flex items-center justify-center">
        <p className="text-lg">Carregando...</p>
      </div>
    )
  }

  if (!pedido) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Orçamento não encontrado</p>
          <Button onClick={() => router.push("/orcamentos")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Orçamentos
          </Button>
        </div>
      </div>
    )
  }

  const statusConfig = {
    ABERTO: { label: "Aberto", color: "bg-yellow-500 text-white" },
    FECHADO: { label: "Fechado", color: "bg-green-500 text-white" },
    CANCELADO: { label: "Cancelado", color: "bg-red-500 text-white" },
  }

  const config = statusConfig[pedido.status as keyof typeof statusConfig] || statusConfig.ABERTO

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-secondary/10 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/orcamentos")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Orçamento #{pedido.id.slice(0, 8).toUpperCase()}
              </h1>
              <p className="text-muted-foreground">
                Criado em {new Date(pedido.dataPedido).toLocaleDateString("pt-BR", {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-bold ${config.color}`}>
              {config.label}
            </span>
          </div>
        </div>

        {/* Cards de Informação */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Cliente */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cliente</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pedido.cliente.nome}</div>
              <p className="text-xs text-muted-foreground mt-1">{pedido.cliente.telefone}</p>
              {pedido.cliente.email && (
                <p className="text-xs text-muted-foreground">{pedido.cliente.email}</p>
              )}
            </CardContent>
          </Card>

          {/* Vendedor */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendedor</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pedido.vendedor.nome}</div>
              <p className="text-xs text-muted-foreground mt-1">Responsável pela venda</p>
            </CardContent>
          </Card>

          {/* Valor Total */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                R$ {Number(pedido.valorTotal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {pedido.itens.length} produto(s)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Produtos */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produtos do Orçamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pedido.itens.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-4 bg-secondary/10 rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{item.produto.nome}</h3>
                    <p className="text-sm text-muted-foreground">{item.produto.categoria}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.quantidade}x R$ {Number(item.precoUnitario).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary">
                      R$ {Number(item.subtotal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}

              {/* Total */}
              <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
                <span className="text-lg font-bold">TOTAL</span>
                <span className="text-2xl font-bold text-primary">
                  R$ {Number(pedido.valorTotal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        {pedido.observacoes && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Observações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{pedido.observacoes}</p>
            </CardContent>
          </Card>
        )}

        {/* Ações */}
        <Card>
          <CardHeader>
            <CardTitle>Ações</CardTitle>
          </CardHeader>
          <CardContent>
            {pedido.status === "ABERTO" && (
              <div className="flex gap-3">
                <Button
                  size="lg"
                  onClick={() => handleUpdateStatus("closed")}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Fechar Pedido
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={handleCancel}
                  className="font-bold"
                >
                  <XCircle className="h-5 w-5 mr-2" />
                  Cancelar
                </Button>
              </div>
            )}

            {(pedido.status === "FECHADO" || pedido.status === "CANCELADO") && (
              <Button
                size="lg"
                onClick={() => {
                  if (confirm("Tem certeza que deseja reabrir este orçamento?")) {
                    handleUpdateStatus("open")
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Reabrir Orçamento
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}