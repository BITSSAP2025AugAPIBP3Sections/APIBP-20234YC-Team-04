import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BarChart3, Clock, Globe, Link2, MousePointerClick, Users } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import type { UrlAnalytics } from "@shared/schema";
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Line, LineChart } from "recharts";

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ClicksByDayChart({ data }: { data: Array<{ date: string; count: number }> }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No click data yet
      </div>
    );
  }

  const chartData = data.map(item => ({
    date: format(new Date(item.date), 'MMM d'),
    clicks: item.count,
  }));

  return (
    <ChartContainer
      config={{
        clicks: {
          label: "Clicks",
          color: "hsl(var(--primary))",
        },
      }}
      className="h-64 w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <XAxis 
            dataKey="date" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line 
            type="monotone" 
            dataKey="clicks" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

function ClicksByHourChart({ data }: { data: Array<{ hour: number; count: number }> }) {
  const hasData = data.some(d => d.count > 0);
  
  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No click data yet
      </div>
    );
  }

  const chartData = data.map(item => ({
    hour: `${item.hour}:00`,
    clicks: item.count,
  }));

  return (
    <ChartContainer
      config={{
        clicks: {
          label: "Clicks",
          color: "hsl(var(--primary))",
        },
      }}
      className="h-64 w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <XAxis 
            dataKey="hour" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            interval={2}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar 
            dataKey="clicks" 
            fill="hsl(var(--primary))" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

function TopReferrersTable({ data }: { data: Array<{ referrer: string; count: number }> }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        No referrer data yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div 
          key={index} 
          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
        >
          <span className="text-sm truncate flex-1 mr-4">
            {item.referrer === 'Direct' ? (
              <span className="text-muted-foreground">Direct traffic</span>
            ) : (
              <a 
                href={item.referrer} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {new URL(item.referrer).hostname}
              </a>
            )}
          </span>
          <Badge variant="secondary">{item.count}</Badge>
        </div>
      ))}
    </div>
  );
}

function TopCountriesTable({ data }: { data: Array<{ country: string; count: number }> }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        No location data yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div 
          key={index} 
          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
        >
          <span className="text-sm">{item.country}</span>
          <Badge variant="secondary">{item.count}</Badge>
        </div>
      ))}
    </div>
  );
}

function RecentClicksTable({ data }: { data: Array<{ clickedAt: string; referrer: string | null; country: string | null; city: string | null }> }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        No clicks recorded yet
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {data.map((click, index) => (
        <div 
          key={index} 
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-muted/50"
        >
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm">
              {formatDistanceToNow(new Date(click.clickedAt), { addSuffix: true })}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {click.referrer && click.referrer !== 'Direct' && (
              <span className="truncate max-w-32">
                from {(() => {
                  try {
                    return new URL(click.referrer).hostname;
                  } catch {
                    return click.referrer;
                  }
                })()}
              </span>
            )}
            {click.country && (
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {click.city ? `${click.city}, ${click.country}` : click.country}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Analytics() {
  const params = useParams();
  const urlId = params.id;

  const { data: analytics, isLoading, error } = useQuery<UrlAnalytics>({
    queryKey: ["/api/urls", urlId, "analytics"],
    enabled: !!urlId,
  });

  const shortUrl = analytics ? `${window.location.origin}/${analytics.url.shortCode}` : "";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="rounded-md bg-primary p-1.5">
              <Link2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">LinkSnip</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Link Analytics</h1>
            {analytics && (
              <a 
                href={shortUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary font-mono hover:underline"
                data-testid="link-analytics-url"
              >
                {shortUrl}
              </a>
            )}
          </div>
        </div>

        {isLoading && <AnalyticsSkeleton />}

        {error && (
          <Card className="p-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Error loading analytics</h3>
              <p className="text-muted-foreground mb-4">
                Could not load analytics for this URL.
              </p>
              <Link href="/">
                <Button>Back to Home</Button>
              </Link>
            </div>
          </Card>
        )}

        {analytics && (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Clicks</CardTitle>
                  <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold" data-testid="text-analytics-clicks">
                    {analytics.url.clicks}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Created</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold">
                    {format(new Date(analytics.url.createdAt), 'MMM d, yyyy')}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(analytics.url.createdAt), { addSuffix: true })}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Top Referrer</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {analytics.topReferrers.length > 0 ? (
                    <div className="text-lg font-semibold truncate">
                      {analytics.topReferrers[0].referrer === 'Direct' 
                        ? 'Direct' 
                        : (() => {
                            try {
                              return new URL(analytics.topReferrers[0].referrer).hostname;
                            } catch {
                              return analytics.topReferrers[0].referrer;
                            }
                          })()
                      }
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm">No data</div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Top Country</CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {analytics.topCountries.length > 0 ? (
                    <div className="text-lg font-semibold">
                      {analytics.topCountries[0].country}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm">No data</div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Clicks Over Time
                  </CardTitle>
                  <CardDescription>Daily click activity for the last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <ClicksByDayChart data={analytics.clicksByDay} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Clicks by Hour
                  </CardTitle>
                  <CardDescription>Click distribution throughout the day</CardDescription>
                </CardHeader>
                <CardContent>
                  <ClicksByHourChart data={analytics.clicksByHour} />
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Top Referrers
                  </CardTitle>
                  <CardDescription>Where your visitors come from</CardDescription>
                </CardHeader>
                <CardContent>
                  <TopReferrersTable data={analytics.topReferrers} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Top Countries
                  </CardTitle>
                  <CardDescription>Geographic distribution of clicks</CardDescription>
                </CardHeader>
                <CardContent>
                  <TopCountriesTable data={analytics.topCountries} />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MousePointerClick className="h-5 w-5" />
                  Recent Clicks
                </CardTitle>
                <CardDescription>Latest 50 click events</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentClicksTable data={analytics.recentClicks} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Link Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Short URL</p>
                  <a 
                    href={shortUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-mono text-primary hover:underline"
                  >
                    {shortUrl}
                  </a>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Original URL</p>
                  <a 
                    href={analytics.url.originalUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm hover:underline break-all"
                  >
                    {analytics.url.originalUrl}
                  </a>
                </div>
                {analytics.url.expiresAt && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Expires</p>
                    <p className="text-sm">
                      {format(new Date(analytics.url.expiresAt), 'MMMM d, yyyy')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>

      <footer className="border-t mt-16">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>LinkSnip - Fast & Simple URL Shortener</p>
        </div>
      </footer>
    </div>
  );
}
