"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, TrendingDown, Clock, Users, DollarSign, Phone, Mail } from "lucide-react"
import Link from "next/link"

interface InactiveClient {
  id: string
  name: string
  phone: string
  email: string
  lastPurchase: string | null
  daysInactive: number
  seller: string
}

interface OpenQuote {
  id: string
  clientName: string
  clientPhone: string
  sellerName: string
  value: number
  date: string
  daysOpen: number
}

interface SellerPerformance {
  name: string
  total: number
  count: number
}

interface ReportsData {
  inactive30: number
  inactive60: number
  inactive90: number
  openQuotes7: number
  openQuotes14: number
  openQuotes30: number
  sellerPerformance: SellerPerformance[]
  inactiveClients: InactiveClient[]
  openQuotes: OpenQuote[]
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadReports() {
      try {
        const res = await fetch("/api/relatorios")
        if (!res.ok) throw new Error("Erro ao carregar relatórios")
        const data = await res.json()
        setReports(data)
      } catch (error) {
        console.error("Erro:", error)
      } finally {
        setLoading(false)
      }
    }
    loadReports()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando relatórios...</p>
        </div>
      </div>
    )
  }

  if (!reports) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10 p-8">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">Erro ao carregar relatórios</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-secondary/10 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">📊 Relatórios</h1>
          <Link href="/dashboard">
            <Button variant="outline">Voltar</Button>
          </Link>
        </div>

        <Tabs defaultValue="inactive" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="inactive" className="gap-2">
              <TrendingDown className="h-4 w-4" />
              Clientes Inativos
            </TabsTrigger>
            <TabsTrigger value="open-quotes" className="gap-2">
              <Clock className="h-4 w-4" />
              Orçamentos Abertos
            </TabsTrigger>
            <TabsTrigger value="sellers" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Performance
            </TabsTrigger>
          </TabsList>

          {/* ABA: Clientes Inativos */}
          <TabsContent value="inactive" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">30 dias</CardTitle>
                  <CardDescription>Sem comprar há 30+ dias</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-yellow-600">{reports.inactive30}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">60 dias</CardTitle>
                  <CardDescription>Sem comprar há 60+ dias</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-orange-600">{reports.inactive60}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">90 dias</CardTitle>
                  <CardDescription>Sem comprar há 90+ dias</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-red-600">{reports.inactive90}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Lista de Clientes Inativos
                </CardTitle>
                <CardDescription>Clientes que precisam de atenção urgente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reports.inactiveClients.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      🎉 Todos os clientes estão ativos!
                    </p>
                  ) : (
                    reports.inactiveClients.map((client) => (
                      <div
                        key={client.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{client.name}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {client.phone}
                            </span>
                            {client.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {client.email}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Vendedor: {client.seller}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              client.daysInactive > 90
                                ? "destructive"
                                : client.daysInactive > 60
                                ? "default"
                                : "secondary"
                            }
                            className="text-lg px-3 py-1"
                          >
                            {client.daysInactive} dias
                          </Badge>
                          {client.lastPurchase && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Última compra: {new Date(client.lastPurchase).toLocaleDateString("pt-BR")}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA: Orçamentos Abertos */}
          <TabsContent value="open-quotes" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">7 dias</CardTitle>
                  <CardDescription>Abertos há 7+ dias</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-yellow-600">{reports.openQuotes7}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">14 dias</CardTitle>
                  <CardDescription>Abertos há 14+ dias</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-orange-600">{reports.openQuotes14}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">30 dias</CardTitle>
                  <CardDescription>Abertos há 30+ dias</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-red-600">{reports.openQuotes30}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Orçamentos Aguardando Fechamento
                </CardTitle>
                <CardDescription>Orçamentos que precisam de follow-up</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reports.openQuotes.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      🎉 Nenhum orçamento pendente!
                    </p>
                  ) : (
                    reports.openQuotes.map((quote) => (
                      <div
                        key={quote.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{quote.clientName}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {quote.clientPhone}
                            </span>
                            <span>Vendedor: {quote.sellerName}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Criado em: {new Date(quote.date).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <div className="text-right space-y-2">
                          <p className="text-2xl font-bold text-primary">
                            R$ {quote.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                          <Badge
                            variant={
                              quote.daysOpen > 30
                                ? "destructive"
                                : quote.daysOpen > 14
                                ? "default"
                                : "secondary"
                            }
                            className="text-base px-3 py-1"
                          >
                            {quote.daysOpen} dias aberto
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA: Performance */}
          <TabsContent value="sellers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Performance por Vendedor
                </CardTitle>
                <CardDescription>Total de vendas fechadas por vendedor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reports.sellerPerformance.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhuma venda registrada ainda
                    </p>
                  ) : (
                    reports.sellerPerformance.map((seller, index) => (
                      <div
                        key={seller.name}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                            {index + 1}º
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{seller.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {seller.count} {seller.count === 1 ? "venda" : "vendas"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            R$ {seller.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}