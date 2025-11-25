"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { AlertCircle, TrendingUp, Users, User, Package, Zap, Clock, Target, MessageCircle, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface Dashboard {
  inactiveClients: number
  openQuotes: number
  monthSales: number
  topSellers: { name: string; sales: number }[]
  topProducts: { name: string; sold: number }[]
  alerts: { id: string; type: string; message: string; client: string; urgency: "high" | "medium" | "low" }[]
  salesData: { month: string; sales: number; target: number }[]
  productMix: { name: string; value: number }[]
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      const res = await fetch("/api/dashboard")
      const data = await res.json()
      setDashboard(data)
      setLoading(false)
    }
    loadDashboard()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 animate-spin mb-4">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <p className="text-lg font-medium text-foreground">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  if (!dashboard) {
    return <div className="p-8 text-center">Erro ao carregar dashboard</div>
  }

  const alertColors = {
    high: "border-l-4 border-destructive bg-destructive/5",
    medium: "border-l-4 border-accent bg-accent/5",
    low: "border-l-4 border-secondary bg-secondary/5",
  }

  const alertIcons = {
    high: "text-destructive",
    medium: "text-accent",
    low: "text-secondary",
  }

  const COLORS = ["#5139c7", "#d97706", "#0891b2", "#dc2626", "#059669"]

  const criticalAlerts = dashboard.alerts.filter((a) => a.urgency === "high")
  const mediumAlerts = dashboard.alerts.filter((a) => a.urgency === "medium")

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-background">
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold text-foreground">Dashboard de Vendas</h1>
            <div className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString("pt-BR", { weekday: "long", month: "long", day: "numeric" })}
            </div>
          </div>
          <p className="text-muted-foreground">LonasExpress - Lonas para Esteira</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Monthly Sales */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-card/50 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Vendas do Mês</CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">R$ {(dashboard.monthSales / 1000).toFixed(1)}k</div>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3 text-green-600" />
                +12% vs mês anterior
              </p>
            </CardContent>
          </Card>

          {/* Inactive Clients */}
          <Link href="/clientes" className="block">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-card/50 hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Clientes em Alerta</CardTitle>
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Users className="h-4 w-4 text-accent" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{dashboard.alerts.length}</div>
                <p className="text-xs text-muted-foreground mt-2">Clique para ver a lista de clientes</p>
              </CardContent>
            </Card>
          </Link>

          {/* Open Quotes */}
          <Link href="/orcamentos" className="block">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-card/50 hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Orçamentos Abertos</CardTitle>
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <Package className="h-4 w-4 text-secondary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{dashboard.openQuotes}</div>
                <p className="text-xs text-muted-foreground mt-2">Aguardando confirmação</p>
              </CardContent>
            </Card>
          </Link>

          {/* Pending Actions */}
          <Card 
            className="border-0 shadow-sm bg-gradient-to-br from-card to-card/50 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => {
              const alertsSection = document.getElementById('alerts-section')
              if (alertsSection) {
                alertsSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ações Necessárias</CardTitle>
              <div className="p-2 bg-destructive/10 rounded-lg">
                <Clock className="h-4 w-4 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{criticalAlerts.length + mediumAlerts.length}</div>
              <p className="text-xs text-muted-foreground mt-2">Clique para ver detalhes</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Sales Trend */}
          <Card className="lg:col-span-2 border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Tendência de Vendas</CardTitle>
              <CardDescription>Últimos 6 meses vs Meta</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboard.salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" stroke="var(--color-muted-foreground)" />
                  <YAxis stroke="var(--color-muted-foreground)" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
                    labelStyle={{ color: "var(--color-foreground)" }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="var(--color-primary)"
                    strokeWidth={3}
                    name="Vendas Reais"
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="var(--color-secondary)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Meta"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Product Mix - CORRIGIDO */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Mix de Produtos</CardTitle>
              <CardDescription>Distribuição de vendas por categoria</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboard.productMix.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={dashboard.productMix}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {dashboard.productMix.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => `${value}%`}
                        contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Legenda personalizada */}
                  <div className="mt-4 space-y-2">
                    {dashboard.productMix.map((entry, index) => (
                      <div key={entry.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-foreground font-medium">{entry.name}</span>
                        </div>
                        <span className="text-muted-foreground font-bold">{entry.value}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-center py-8 text-muted-foreground">Sem dados de vendas</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Performers */}
        <Tabs defaultValue="sellers" className="space-y-4 mb-8" id="alerts-section">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="sellers" className="gap-2">
              <Target className="h-4 w-4" />
              Top Vendedores
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              Top Produtos
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Alertas ({dashboard.alerts.length})
            </TabsTrigger>
          </TabsList>

          {/* Top Sellers Tab */}
          <TabsContent value="sellers">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Melhores Vendedores - Últimos 6 Meses</CardTitle>
                <CardDescription>Performance acumulada de vendas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboard.topSellers}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="name" stroke="var(--color-muted-foreground)" />
                    <YAxis stroke="var(--color-muted-foreground)" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
                      formatter={(value) => `R$ ${value.toLocaleString("pt-BR")}`}
                    />
                    <Bar dataKey="sales" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Products Tab */}
          <TabsContent value="products">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Produtos Mais Vendidos</CardTitle>
                <CardDescription>Quantidade de unidades vendidas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {dashboard.topProducts.map((product, idx) => (
                    <div key={product.name}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-foreground">{product.name}</span>
                        <span className="text-sm font-bold text-primary">{product.sold} un</span>
                      </div>
                      <div className="w-full bg-secondary/20 rounded-full h-2.5">
                        <div
                          className="bg-gradient-to-r from-primary to-accent h-2.5 rounded-full transition-all"
                          style={{ width: `${(product.sold / 180) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Alertas de Clientes</CardTitle>
                <CardDescription>Todos os clientes que precisam de atenção</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboard.alerts.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">
                      🎉 Nenhum alerta pendente!
                    </p>
                  ) : (
                    dashboard.alerts.map((alert) => (
                      <Alert key={alert.id} className={alertColors[alert.urgency]}>
                        <AlertCircle className={`h-4 w-4 ${alertIcons[alert.urgency]}`} />
                        <div className="flex-1 ml-3">
                          <AlertTitle className="text-sm font-semibold">
                            {alert.client}
                            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                              alert.urgency === 'high' 
                                ? 'bg-red-100 text-red-700' 
                                : alert.urgency === 'medium'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {alert.urgency === 'high' ? '🔴 Urgente' : alert.urgency === 'medium' ? '🟡 Média' : '🟢 Baixa'}
                            </span>
                          </AlertTitle>
                          <AlertDescription className="text-xs">{alert.message}</AlertDescription>
                        </div>
                        <Button variant="ghost" size="sm">
                          Contatar
                        </Button>
                      </Alert>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Navigation Buttons */}
<div className="grid grid-cols-2 md:grid-cols-6 gap-3">
  <Link href="/clientes" className="block">
    <Button
      variant="outline"
      className="w-full bg-card hover:bg-secondary/10 border-border hover:border-primary/50 transition-all"
    >
      <Users className="h-4 w-4 mr-2" />
      Clientes
    </Button>
  </Link>
  <Link href="/vendedores" className="block">
    <Button
      variant="outline"
      className="w-full bg-card hover:bg-secondary/10 border-border hover:border-primary/50 transition-all"
    >
      <User className="h-4 w-4 mr-2" />
      Vendedores
    </Button>
  </Link>
  <Link href="/produtos" className="block">
    <Button
      variant="outline"
      className="w-full bg-card hover:bg-secondary/10 border-border hover:border-primary/50 transition-all"
    >
      <Package className="h-4 w-4 mr-2" />
      Produtos
    </Button>
  </Link>
  <Link href="/orcamentos" className="block">
    <Button
      variant="outline"
      className="w-full bg-card hover:bg-secondary/10 border-border hover:border-primary/50 transition-all"
    >
      <Target className="h-4 w-4 mr-2" />
      Orçamentos
    </Button>
  </Link>
  <Link href="/alertas" className="block">
    <Button
      variant="outline"
      className="w-full bg-card hover:bg-secondary/10 border-border hover:border-primary/50 transition-all"
    >
      <MessageCircle className="h-4 w-4 mr-2" />
      Alertas
    </Button>
  </Link>
  <Link href="/relatorios" className="block">
    <Button
      variant="outline"
      className="w-full bg-card hover:bg-secondary/10 border-border hover:border-primary/50 transition-all"
    >
      <TrendingUp className="h-4 w-4 mr-2" />
      Relatórios
    </Button>
  </Link>
</div>
      </div>
    </main>
  )
}