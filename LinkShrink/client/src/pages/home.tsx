import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link2, Copy, Check, Trash2, ExternalLink, BarChart3, LinkIcon, MousePointerClick, TrendingUp, Loader2, Settings2, Calendar, QrCode, Download, Plus, X, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow, format, addDays, addWeeks, addMonths } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import { Link } from "wouter";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Url, UrlStats } from "@shared/schema";
import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

const urlFormSchema = z.object({
  originalUrl: z.string().url("Please enter a valid URL (include https://)"),
  customCode: z.string().min(3, "At least 3 characters").max(20, "Max 20 characters").regex(/^[A-Za-z0-9_-]+$/, "Only letters, numbers, - and _").optional().or(z.literal("")),
  expiresAt: z.string().optional(),
});

type UrlFormValues = z.infer<typeof urlFormSchema>;

const bulkUrlFormSchema = z.object({
  urls: z.string().min(1, "Enter at least one URL"),
});

type BulkUrlFormValues = z.infer<typeof bulkUrlFormSchema>;

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className={className}
      data-testid="button-copy"
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}

function QRCodeDialog({ url, shortCode }: { url: string; shortCode: string }) {
  const qrRef = useRef<HTMLDivElement>(null);

  const downloadQR = () => {
    if (!qrRef.current) return;
    
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 256;
      canvas.height = 256;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `qr-${shortCode}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" data-testid="button-qr" aria-label="Show QR code">
          <QrCode className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div ref={qrRef} className="bg-white p-4 rounded-lg">
            <QRCodeSVG value={url} size={200} level="H" />
          </div>
          <p className="text-sm text-muted-foreground font-mono">{shortCode}</p>
          <Button onClick={downloadQR} className="gap-2" data-testid="button-download-qr">
            <Download className="h-4 w-4" />
            Download PNG
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatsCards({ stats, isLoading }: { stats?: UrlStats; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total URLs</CardTitle>
          <LinkIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold" data-testid="text-total-urls">
            {stats.totalUrls}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Clicks</CardTitle>
          <MousePointerClick className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold" data-testid="text-total-clicks">
            {stats.totalClicks}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Top Performer</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {stats.mostPopularUrl ? (
            <div>
              <div className="text-lg font-semibold font-mono" data-testid="text-top-performer">
                {stats.mostPopularUrl.shortCode}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.mostPopularUrl.clicks} clicks
              </p>
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">No data yet</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function UrlListItem({ url, onDelete }: { url: Url; onDelete: (id: string) => void }) {
  const shortUrl = `${window.location.origin}/${url.shortCode}`;
  const isExpired = url.expiresAt && new Date(url.expiresAt) < new Date();
  const isExpiringSoon = url.expiresAt && !isExpired && new Date(url.expiresAt) < addDays(new Date(), 3);
  
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border bg-card hover-elevate ${isExpired ? 'opacity-60' : ''}`}>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <a 
            href={shortUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-mono text-primary font-medium hover:underline truncate"
            data-testid={`link-short-${url.id}`}
          >
            {url.shortCode}
          </a>
          <CopyButton text={shortUrl} />
          {isExpired && (
            <Badge variant="destructive" className="text-xs">Expired</Badge>
          )}
          {isExpiringSoon && (
            <Badge variant="secondary" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Expires soon
            </Badge>
          )}
        </div>
        <a 
          href={url.originalUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground hover:text-foreground truncate block max-w-md"
          data-testid={`link-original-${url.id}`}
        >
          {url.originalUrl}
        </a>
        {url.expiresAt && (
          <p className="text-xs text-muted-foreground">
            {isExpired ? 'Expired' : 'Expires'}: {format(new Date(url.expiresAt), 'MMM d, yyyy')}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 sm:gap-4 text-sm">
        <div className="flex items-center gap-1 text-muted-foreground">
          <BarChart3 className="h-4 w-4" />
          <span data-testid={`text-clicks-${url.id}`}>{url.clicks}</span>
        </div>
        <span className="text-muted-foreground hidden sm:inline">
          {formatDistanceToNow(new Date(url.createdAt), { addSuffix: true })}
        </span>
        <div className="flex items-center gap-1">
          <QRCodeDialog url={shortUrl} shortCode={url.shortCode} />
          <Link href={`/analytics/${url.id}`}>
            <Button
              variant="ghost"
              size="icon"
              aria-label="View analytics"
              data-testid={`button-analytics-${url.id}`}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            asChild
          >
            <a 
              href={url.originalUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Open original URL"
              data-testid={`button-open-${url.id}`}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(url.id)}
            className="text-muted-foreground hover:text-destructive"
            data-testid={`button-delete-${url.id}`}
            aria-label="Delete URL"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function UrlList({ urls, isLoading, onDelete }: { urls?: Url[]; isLoading: boolean; onDelete: (id: string) => void }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-lg border bg-card">
            <div className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!urls || urls.length === 0) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Link2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No URLs yet</h3>
          <p className="text-muted-foreground max-w-sm">
            Paste a long URL above to create your first short link. It only takes a second.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {urls.map((url) => (
        <UrlListItem key={url.id} url={url} onDelete={onDelete} />
      ))}
    </div>
  );
}

export default function Home() {
  const { toast } = useToast();
  const [justCreated, setJustCreated] = useState<Url | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState("single");

  const form = useForm<UrlFormValues>({
    resolver: zodResolver(urlFormSchema),
    defaultValues: {
      originalUrl: "",
      customCode: "",
      expiresAt: "",
    },
  });

  const bulkForm = useForm<BulkUrlFormValues>({
    resolver: zodResolver(bulkUrlFormSchema),
    defaultValues: {
      urls: "",
    },
  });

  const { data: urls, isLoading: urlsLoading } = useQuery<Url[]>({
    queryKey: ["/api/urls"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<UrlStats>({
    queryKey: ["/api/stats"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: UrlFormValues) => {
      const payload: { originalUrl: string; customCode?: string; expiresAt?: string } = {
        originalUrl: data.originalUrl,
      };
      if (data.customCode) {
        payload.customCode = data.customCode;
      }
      if (data.expiresAt) {
        payload.expiresAt = data.expiresAt;
      }
      const res = await apiRequest("POST", "/api/urls", payload);
      return res.json();
    },
    onSuccess: (newUrl: Url) => {
      queryClient.invalidateQueries({ queryKey: ["/api/urls"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      form.reset();
      setJustCreated(newUrl);
      setShowAdvanced(false);
      toast({
        title: "URL shortened!",
        description: "Your short link is ready to use.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to shorten URL",
        variant: "destructive",
      });
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async (data: BulkUrlFormValues) => {
      const urlList = data.urls
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(originalUrl => ({ originalUrl }));
      
      const res = await apiRequest("POST", "/api/urls/bulk", { urls: urlList });
      return res.json();
    },
    onSuccess: (createdUrls: Url[]) => {
      queryClient.invalidateQueries({ queryKey: ["/api/urls"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      bulkForm.reset();
      toast({
        title: "URLs shortened!",
        description: `Successfully created ${createdUrls.length} short links.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to shorten URLs",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/urls/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/urls"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      if (justCreated) {
        setJustCreated(null);
      }
      toast({
        title: "URL deleted",
        description: "The short link has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete URL",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UrlFormValues) => {
    setJustCreated(null);
    createMutation.mutate(data);
  };

  const onBulkSubmit = (data: BulkUrlFormValues) => {
    setJustCreated(null);
    bulkCreateMutation.mutate(data);
  };

  const handleExpiryChange = (value: string) => {
    let expiryDate: Date | undefined;
    switch (value) {
      case "1day":
        expiryDate = addDays(new Date(), 1);
        break;
      case "7days":
        expiryDate = addWeeks(new Date(), 1);
        break;
      case "30days":
        expiryDate = addMonths(new Date(), 1);
        break;
      case "90days":
        expiryDate = addMonths(new Date(), 3);
        break;
      default:
        expiryDate = undefined;
    }
    form.setValue("expiresAt", expiryDate?.toISOString() || "");
  };

  const shortUrl = justCreated ? `${window.location.origin}/${justCreated.shortCode}` : "";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="rounded-md bg-primary p-1.5">
              <Link2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">LinkSnip</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <Card className="p-6 md:p-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <h1 className="text-2xl md:text-4xl font-semibold tracking-tight">
                Shorten your links
              </h1>
              <p className="text-muted-foreground">
                Paste a long URL below to create a short, shareable link instantly.
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="single" data-testid="tab-single">Single URL</TabsTrigger>
                <TabsTrigger value="bulk" data-testid="tab-bulk">Bulk URLs</TabsTrigger>
              </TabsList>

              <TabsContent value="single" className="space-y-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="originalUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="flex flex-col sm:flex-row gap-3">
                              <Input
                                placeholder="https://example.com/very/long/url/that/needs/shortening"
                                className="flex-1 h-12 px-4 text-base"
                                data-testid="input-url"
                                {...field}
                              />
                              <Button 
                                type="submit" 
                                size="lg"
                                className="h-12 px-6"
                                disabled={createMutation.isPending}
                                data-testid="button-shorten"
                              >
                                {createMutation.isPending ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Shortening...
                                  </>
                                ) : (
                                  <>
                                    <Link2 className="h-4 w-4 mr-2" />
                                    Shorten URL
                                  </>
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" data-testid="button-advanced">
                          <Settings2 className="h-4 w-4" />
                          Advanced options
                          {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4 pt-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="customCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <LinkIcon className="h-4 w-4" />
                                  Custom alias
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="my-custom-link"
                                    data-testid="input-custom-code"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Expiration
                            </FormLabel>
                            <Select onValueChange={handleExpiryChange} data-testid="select-expiry">
                              <SelectTrigger data-testid="select-expiry-trigger">
                                <SelectValue placeholder="Never expires" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="never">Never expires</SelectItem>
                                <SelectItem value="1day">1 day</SelectItem>
                                <SelectItem value="7days">7 days</SelectItem>
                                <SelectItem value="30days">30 days</SelectItem>
                                <SelectItem value="90days">90 days</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="bulk" className="space-y-4">
                <Form {...bulkForm}>
                  <form onSubmit={bulkForm.handleSubmit(onBulkSubmit)} className="space-y-4">
                    <FormField
                      control={bulkForm.control}
                      name="urls"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Enter URLs (one per line)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={"https://example.com/page1\nhttps://example.com/page2\nhttps://example.com/page3"}
                              className="min-h-32 font-mono text-sm"
                              data-testid="input-bulk-urls"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      disabled={bulkCreateMutation.isPending}
                      data-testid="button-bulk-shorten"
                    >
                      {bulkCreateMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Shorten All URLs
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>

            {justCreated && (
              <div className="p-4 rounded-lg bg-muted/50 border border-primary/20 space-y-3">
                <p className="text-sm text-muted-foreground">Your shortened URL:</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <a 
                    href={shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-lg text-primary font-medium hover:underline truncate flex-1 min-w-0"
                    data-testid="link-created-url"
                  >
                    {shortUrl}
                  </a>
                  <div className="flex items-center gap-1">
                    <CopyButton text={shortUrl} />
                    <QRCodeDialog url={shortUrl} shortCode={justCreated.shortCode} />
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                    >
                      <a 
                        href={shortUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        aria-label="Open short URL"
                        data-testid="button-open-created"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  Original: {justCreated.originalUrl}
                </p>
                {justCreated.expiresAt && (
                  <p className="text-xs text-muted-foreground">
                    Expires: {format(new Date(justCreated.expiresAt), 'MMMM d, yyyy')}
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>

        {(urls && urls.length > 0) || statsLoading ? (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Analytics</h2>
            <StatsCards stats={stats} isLoading={statsLoading} />
          </section>
        ) : null}

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Recent URLs</h2>
          <UrlList 
            urls={urls} 
            isLoading={urlsLoading} 
            onDelete={(id) => deleteMutation.mutate(id)} 
          />
        </section>
      </main>

      <footer className="border-t mt-16">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>LinkSnip - Fast & Simple URL Shortener</p>
        </div>
      </footer>
    </div>
  );
}
