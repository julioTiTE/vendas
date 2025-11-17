"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Search, Phone, Mail, Users, CheckCircle, AlertCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface Client {
  id: string
  name: string
  phone: string
  email: string
  lastPurchase: string
  seller: string
  status: "baixa" | "media" | "urgente"
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [newClient, setNewClient] = useState({ name: "", phone: "", email: "", seller: "" })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    const res = await fetch("/api/clientes")
    const data = await res.json()
    setClients(data)
  }

  async function handleAddClient() {
    if (!newClient.name || !newClient.phone) {
      alert("Nome e telefone são obrigatórios")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClient),
      })
      if (res.ok) {
        setNewClient({ name: "", phone: "", email: "", seller: "" })
        setOpen(false)
        loadClients()
      } else {
        alert("Erro ao adicionar cliente")
      }
    } catch (error) {
      console.error("Erro:", error)
      alert("Erro ao adicionar cliente")
    } finally {
      setSaving(false)
    }
  }

  // Filtrar por busca
  const filtered = clients.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  )

  // Separar por status
  const allClients = filtered
  const baixaPrioridade = filtered.filter((c) => c.status === "baixa")
  const mediaPrioridade = filtered.filter((c) => c.status === "media")
  const urgenteClients = filtered.filter((c) => c.status === "urgente")

  // Configuração de cores e labels
  const statusConfig = {
    baixa: {
      label: "Baixa",
      badgeClass: "bg-green-500 text-white",
      tabClass: "bg-green-100 text-green-800",
    },
    media: {
      label: "Média",
      badgeClass: "bg-yellow-500 text-white",
      tabClass: "bg-yellow-100 text-yellow-800",
    },
    urgente: {
      label: "Urgente",
      badgeClass: "bg-red-500 text-white",
      tabClass: "bg-red-100 text-red-800",
    },
  }

  // Componente de lista de clientes
  const ClientList = ({ clients }: { clients: Client[] }) => (
    <div className="grid gap-4">
      {clients.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum cliente encontrado</p>
        </div>
      ) : (
        clients.map((client) => (
          <Link key={client.id} href={`/clientes/${client.id}`}>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">{client.name}</h3>
                    <div className="text-sm text-muted-foreground flex flex-col md:flex-row gap-2 md:gap-4">
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {client.phone}
                      </span>
                      {client.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {client.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold ${
                        statusConfig[client.status].badgeClass
                      }`}
                    >
                      {statusConfig[client.status].label}
                    </span>
                    <p className="text-sm text-muted-foreground mt-2">
                      Vendedor: {client.seller}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Última compra: {new Date(client.lastPurchase).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))
      )}
    </div>
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-secondary/10 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Clientes</h1>
            <p className="text-sm text-muted-foreground mt-1">
              🟢 Baixa: &lt;3 meses | 🟡 Média: 3-6 meses | 🔴 Urgente: &gt;6 meses
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Cliente</DialogTitle>
                <DialogDescription>Preencha os dados do cliente</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Nome *</label>
                  <Input
                    placeholder="Nome do cliente"
                    value={newClient.name}
                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Telefone *</label>
                  <Input
                    placeholder="(11) 99999-9999"
                    value={newClient.phone}
                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Email</label>
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Vendedor Responsável</label>
                  <Input
                    placeholder="Nome do vendedor"
                    value={newClient.seller}
                    onChange={(e) => setNewClient({ ...newClient, seller: e.target.value })}
                  />
                </div>
                <Button
                  onClick={handleAddClient}
                  disabled={saving || !newClient.name || !newClient.phone}
                  className="w-full"
                >
                  {saving ? "Salvando..." : "Salvar Cliente"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Barra de busca */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Abas de filtro com 4 opções */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="all" className="gap-2">
              <Users className="h-4 w-4" />
              Todos
              <span className="ml-1 px-2 py-0.5 bg-primary/10 rounded-full text-xs font-bold">
                {allClients.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="baixa" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Baixa
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${statusConfig.baixa.tabClass}`}>
                {baixaPrioridade.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="media" className="gap-2">
              <AlertCircle className="h-4 w-4" />
              Média
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${statusConfig.media.tabClass}`}>
                {mediaPrioridade.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="urgente" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Urgente
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${statusConfig.urgente.tabClass}`}>
                {urgenteClients.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <ClientList clients={allClients} />
          </TabsContent>

          <TabsContent value="baixa">
            <ClientList clients={baixaPrioridade} />
          </TabsContent>

          <TabsContent value="media">
            <ClientList clients={mediaPrioridade} />
          </TabsContent>

          <TabsContent value="urgente">
            <ClientList clients={urgenteClients} />
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