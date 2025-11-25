"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/toast"
import { 
  AlertCircle, 
  CheckCircle, 
  Copy, 
  Clock,
  UserX,
  FileText,
  Calendar,
  MessageSquare,
  Filter,
  RefreshCw
} from "lucide-react"
import Link from "next/link"

interface Alerta {
  id: string
  tipo: string
  mensagem: string
  urgencia: string
  dataCriacao: string
  status: string
  cliente: {
    id: string
    nome: string
    telefone: string
    email?: string
    vendedor: {
      nome: string
    }
  }
}

interface MensagemPronta {
  titulo: string
  template: string
  variaveis: string[]
}

export default function AlertasPage() {
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [mensagens, setMensagens] = useState<{ [key: string]: MensagemPronta[] }>({})
  const [filtroTipo, setFiltroTipo] = useState<string>("TODOS")
  const [filtroUrgencia, setFiltroUrgencia] = useState<string>("TODOS")
  const [loading, setLoading] = useState(true)
  const [gerandoAlertas, setGerandoAlertas] = useState(false)
  const [mensagemSelecionada, setMensagemSelecionada] = useState<string>("")
  const [alertaSelecionado, setAlertaSelecionado] = useState<Alerta | null>(null)
  
  const { showToast, hideToast, ToastComponent } = useToast()

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    setLoading(true)
    try {
      const [alertasRes, mensagensRes] = await Promise.all([
        fetch("/api/alertas"),
        fetch("/api/mensagens-prontas")
      ])
      
      const alertasData = await alertasRes.json()
      const mensagensData = await mensagensRes.json()
      
      setAlertas(alertasData.alertas || [])
      setMensagens(mensagensData.mensagens || {})
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      showToast('Erro ao carregar dados', 'error')
    }
    setLoading(false)
  }

  async function gerarNovosAlertas() {
    setGerandoAlertas(true)
    showToast('Gerando novos alertas...', 'loading')
    try {
      await fetch("/api/alertas/gerar", { method: "POST" })
      await carregarDados()
      hideToast()
      showToast('Novos alertas gerados com sucesso!', 'success')
    } catch (error) {
      console.error("Erro ao gerar alertas:", error)
      hideToast()
      showToast('Erro ao gerar alertas', 'error')
    }
    setGerandoAlertas(false)
  }

  async function marcarComoResolvido(alertaId: string) {
    try {
      await fetch("/api/alertas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertaId })
      })
      await carregarDados()
      showToast('Alerta marcado como resolvido', 'success')
    } catch (error) {
      console.error("Erro ao resolver alerta:", error)
      showToast('Erro ao resolver alerta', 'error')
    }
  }

  function personalizarMensagem(template: string, alerta: Alerta) {
    let mensagem = template
    
    // Substitui variáveis
    mensagem = mensagem.replace(/{nome}/g, alerta.cliente.nome)
    mensagem = mensagem.replace(/{vendedor}/g, alerta.cliente.vendedor.nome)
    mensagem = mensagem.replace(/{desconto}/g, "10")
    mensagem = mensagem.replace(/{cupom}/g, "ANIVER10")
    
    const dataValidade = new Date()
    dataValidade.setDate(dataValidade.getDate() + 7)
    mensagem = mensagem.replace(/{dataValidade}/g, dataValidade.toLocaleDateString("pt-BR"))
    
    mensagem = mensagem.replace(/{produto}/g, "produtos")
    mensagem = mensagem.replace(/{oferta}/g, "10% OFF em toda a loja")
    mensagem = mensagem.replace(/{condicao}/g, "Frete grátis")
    mensagem = mensagem.replace(/{produtoComprado}/g, "seu último pedido")
    mensagem = mensagem.replace(/{produtoComplementar}/g, "novos produtos")
    
    return mensagem
  }

  function copiarMensagem(mensagem: string) {
    navigator.clipboard.writeText(mensagem)
    showToast('Mensagem copiada!', 'success')
  }

  const alertasFiltrados = alertas.filter(alerta => {
    const passaTipo = filtroTipo === "TODOS" || alerta.tipo === filtroTipo
    const passaUrgencia = filtroUrgencia === "TODOS" || alerta.urgencia === filtroUrgencia
    return passaTipo && passaUrgencia
  })

  const estatisticas = {
    total: alertas.length,
    urgentes: alertas.filter(a => a.urgencia === "ALTA").length,
    aniversarios: alertas.filter(a => a.tipo === "ANIVERSARIO").length,
    inativos: alertas.filter(a => a.tipo === "CLIENTE_INATIVO").length,
    orcamentos: alertas.filter(a => a.tipo === "ORCAMENTO_ABERTO").length
  }

  const getUrgenciaColor = (urgencia: string) => {
    switch (urgencia) {
      case "ALTA": return "destructive"
      case "MEDIA": return "default"
      case "BAIXA": return "secondary"
      default: return "outline"
    }
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "ANIVERSARIO": return <Calendar className="h-4 w-4" />
      case "CLIENTE_INATIVO": return <UserX className="h-4 w-4" />
      case "ORCAMENTO_ABERTO": return <FileText className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Carregando alertas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Central de Alertas</h1>
              <p className="text-muted-foreground">
                Gerencie ações pendentes e envie mensagens personalizadas
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard">
                <Button variant="outline">← Voltar</Button>
              </Link>
              <Button 
                onClick={gerarNovosAlertas} 
                disabled={gerandoAlertas}
                className="gap-2"
              >
                <RefreshCw className={gerandoAlertas ? "animate-spin" : ""} />
                Atualizar Alertas
              </Button>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estatisticas.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Urgentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{estatisticas.urgentes}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Aniversários</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estatisticas.aniversarios}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Inativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estatisticas.inativos}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Orçamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estatisticas.orcamentos}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Alerta</label>
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="border rounded-md px-3 py-2 bg-background"
                >
                  <option value="TODOS">Todos</option>
                  <option value="ANIVERSARIO">Aniversários</option>
                  <option value="CLIENTE_INATIVO">Clientes Inativos</option>
                  <option value="ORCAMENTO_ABERTO">Orçamentos Abertos</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Urgência</label>
                <select
                  value={filtroUrgencia}
                  onChange={(e) => setFiltroUrgencia(e.target.value)}
                  className="border rounded-md px-3 py-2 bg-background"
                >
                  <option value="TODOS">Todas</option>
                  <option value="ALTA">Alta</option>
                  <option value="MEDIA">Média</option>
                  <option value="BAIXA">Baixa</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Alertas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna Esquerda: Alertas */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">
              Alertas Pendentes ({alertasFiltrados.length})
            </h2>
            {alertasFiltrados.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p className="text-lg font-medium">Nenhum alerta pendente!</p>
                  <p className="text-muted-foreground">Todos os clientes estão em dia 🎉</p>
                </CardContent>
              </Card>
            ) : (
              alertasFiltrados.map((alerta) => (
                <Card
                  key={alerta.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    alertaSelecionado?.id === alerta.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setAlertaSelecionado(alerta)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">{getTipoIcon(alerta.tipo)}</div>
                        <div>
                          <CardTitle className="text-lg">{alerta.cliente.nome}</CardTitle>
                          <CardDescription className="mt-1">
                            {alerta.mensagem}
                          </CardDescription>
                          <div className="flex gap-2 mt-2">
                            <Badge variant={getUrgenciaColor(alerta.urgencia)}>
                              {alerta.urgencia}
                            </Badge>
                            <Badge variant="outline">{alerta.tipo.replace("_", " ")}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        <div>📱 {alerta.cliente.telefone}</div>
                        <div>👤 Vendedor: {alerta.cliente.vendedor.nome}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          marcarComoResolvido(alerta.id)
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Resolver
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Coluna Direita: Mensagens Prontas */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              <MessageSquare className="inline h-5 w-5 mr-2" />
              Mensagens Prontas
            </h2>
            {!alertaSelecionado ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">Selecione um alerta</p>
                  <p className="text-muted-foreground">
                    Clique em um alerta para ver as mensagens prontas
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue="mensagens" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="mensagens">Modelos</TabsTrigger>
                  <TabsTrigger value="personalizada">Personalizada</TabsTrigger>
                </TabsList>

                <TabsContent value="mensagens" className="space-y-3">
                  {mensagens[alertaSelecionado.tipo]?.map((msg, idx) => {
                    const mensagemPersonalizada = personalizarMensagem(msg.template, alertaSelecionado)
                    return (
                      <Card key={idx}>
                        <CardHeader>
                          <CardTitle className="text-sm">{msg.titulo}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-secondary/20 p-3 rounded-md mb-3 whitespace-pre-wrap text-sm">
                            {mensagemPersonalizada}
                          </div>
                          
                          {/* Botões de Ação */}
                          <div className="grid grid-cols-2 gap-2">
                            {/* Botão WhatsApp */}
                            <Button
                              className="gap-2 bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                copiarMensagem(mensagemPersonalizada)
                                const telefone = alertaSelecionado.cliente.telefone.replace(/\D/g, '')
                                const whatsappUrl = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagemPersonalizada)}`
                                window.open(whatsappUrl, '_blank')
                              }}
                            >
                              <MessageSquare className="h-4 w-4" />
                              WhatsApp
                            </Button>

                            {/* Botão Email */}
                            <Button
                              className="gap-2"
                              onClick={async () => {
                                if (!alertaSelecionado.cliente.email) {
                                  showToast('Cliente não possui email cadastrado', 'error')
                                  return
                                }
                                
                                showToast('Enviando email...', 'loading')
                                
                                try {
                                  const res = await fetch('/api/email/enviar-alerta', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ alertaId: alertaSelecionado.id })
                                  })
                                  
                                  hideToast()
                                  
                                  if (res.ok) {
                                    showToast('Email enviado com sucesso!', 'success')
                                    await carregarDados()
                                  } else {
                                    showToast('Erro ao enviar email', 'error')
                                  }
                                } catch (error) {
                                  hideToast()
                                  showToast('Erro ao enviar email', 'error')
                                }
                              }}
                              disabled={!alertaSelecionado.cliente.email}
                            >
                              <Copy className="h-4 w-4" />
                              Email
                            </Button>
                          </div>

                          {!alertaSelecionado.cliente.email && (
                            <p className="text-xs text-muted-foreground mt-2 text-center">
                              ⚠️ Email indisponível - cadastre no perfil do cliente
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </TabsContent>

                <TabsContent value="personalizada">
                  <Card>
                    <CardHeader>
                      <CardTitle>Escreva sua mensagem</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <textarea
                        className="w-full h-40 p-3 border rounded-md bg-background"
                        placeholder="Digite sua mensagem personalizada..."
                        value={mensagemSelecionada}
                        onChange={(e) => setMensagemSelecionada(e.target.value)}
                      />
                      
                      {/* Botões de Ação */}
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        {/* Botão WhatsApp */}
                        <Button
                          className="gap-2 bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            if (!mensagemSelecionada.trim()) {
                              showToast('Digite uma mensagem primeiro!', 'error')
                              return
                            }
                            copiarMensagem(mensagemSelecionada)
                            const telefone = alertaSelecionado?.cliente.telefone.replace(/\D/g, '') || ''
                            const whatsappUrl = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagemSelecionada)}`
                            window.open(whatsappUrl, '_blank')
                          }}
                          disabled={!mensagemSelecionada.trim() || !alertaSelecionado}
                        >
                          <MessageSquare className="h-4 w-4" />
                          Enviar WhatsApp
                        </Button>

                        {/* Botão Email */}
                        <Button
                          className="gap-2"
                          onClick={async () => {
                            if (!mensagemSelecionada.trim()) {
                              showToast('Digite uma mensagem primeiro!', 'error')
                              return
                            }
                            
                            if (!alertaSelecionado?.cliente.email) {
                              showToast('Cliente não possui email cadastrado', 'error')
                              return
                            }
                            
                            const assunto = prompt('Digite o assunto do email:', 
                              `Mensagem para ${alertaSelecionado.cliente.nome}`)
                            
                            if (!assunto) return
                            
                            showToast('Enviando email...', 'loading')
                            
                            try {
                              const res = await fetch('/api/email/enviar-personalizado', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                  alertaId: alertaSelecionado.id,
                                  mensagem: mensagemSelecionada,
                                  assunto
                                })
                              })
                              
                              hideToast()
                              
                              if (res.ok) {
                                showToast('Email enviado com sucesso!', 'success')
                                setMensagemSelecionada('')
                                await carregarDados()
                              } else {
                                showToast('Erro ao enviar email', 'error')
                              }
                            } catch (error) {
                              hideToast()
                              showToast('Erro ao enviar email', 'error')
                            }
                          }}
                          disabled={!mensagemSelecionada.trim() || !alertaSelecionado?.cliente.email}
                        >
                          <Copy className="h-4 w-4" />
                          Enviar Email
                        </Button>
                      </div>

                      {alertaSelecionado && !alertaSelecionado.cliente.email && (
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          ⚠️ Email indisponível - cadastre no perfil do cliente
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
      
      {/* Toast Component */}
      {ToastComponent}
    </div>
  )
}