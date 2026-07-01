import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Facebook,
  ImageOff,
  Instagram,
  MapPin,
  MessageCircle,
  PackageCheck,
  Phone,
  Send,
  ShieldCheck,
  Store,
  Truck,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { LeafletMap } from "@/components/ui/LeafletMap";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";

function PageHeader({
  eyebrow,
  title,
  description,
  centered = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  centered?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-3 ${centered ? "items-center text-center" : ""}`}
    >
      <span className="text-xs font-bold uppercase tracking-[0.16em] text-text-faint">
        {eyebrow}
      </span>
      <div
        className={`max-w-3xl space-y-2 ${centered ? "mx-auto text-center" : ""}`}
      >
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          {title}
        </h1>
        <p className="text-base text-text-soft">{description}</p>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  children,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <Card>
      <CardBody className="flex h-full flex-col gap-3">
        <div className="flex items-center gap-2 text-base font-bold">
          {icon}
          <span>{title}</span>
        </div>
        <div className="space-y-2 text-sm leading-6 text-text-soft">
          {children}
        </div>
      </CardBody>
    </Card>
  );
}

function ButtonLink({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  return (
    <Link to={to}>
      <Button variant="ghost">{children}</Button>
    </Link>
  );
}

type Tab = "nosotros" | "contacto" | "ubicacion";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "nosotros",
    label: "Quiénes somos",
    icon: <Store size={16} aria-hidden="true" />,
  },
  {
    id: "contacto",
    label: "Contacto",
    icon: <MessageCircle size={16} aria-hidden="true" />,
  },
  {
    id: "ubicacion",
    label: "Ubicación",
    icon: <MapPin size={16} aria-hidden="true" />,
  },
];

export function NosotrosPage() {
  const { settings } = useBusinessSettings();
  const [tab, setTab] = useState<Tab>("nosotros");

  const negocio = settings.nombreNegocio ?? "Tecnologia Importada";
  const whatsapp = settings.whatsapp?.replace(/\D/g, "") ?? "";
  const whatsappHref = whatsapp ? `https://wa.me/${whatsapp}` : "";
  const instagramHref = settings.instagram?.trim() || "";
  const direccion = settings.direccion?.trim() || "";
  const telefono = settings.telefono?.trim() || whatsapp;
  const nosotrosTexto =
    settings.nosotrosTexto ??
    "Mostramos stock confiable, respondemos rapido y acompanamos cada venta con informacion clara.";
  const contactoTitulo =
    settings.contactoTitulo ??
    "Te respondemos por WhatsApp con stock y opciones reales.";
  const contactoTexto =
    settings.contactoTexto ??
    "Podes escribirnos para consultar disponibilidad, compatibilidad, medios de pago o coordinar un pedido.";
  const googleMapsUrl = settings.mapaEmbedUrl?.trim() || "";
  const hasCoords = settings.mapLat != null && settings.mapLon != null;
  const mapsAppHref = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${settings.mapLat},${settings.mapLon}`
    : googleMapsUrl;
  const googleEmbedSrc = hasCoords
    ? `https://www.google.com/maps?q=${settings.mapLat},${settings.mapLon}&z=16&output=embed`
    : googleMapsUrl
      ? `https://www.google.com/maps?q=${encodeURIComponent(googleMapsUrl)}&z=16&output=embed`
      : "";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      {/* Tabs */}
      <div className="inline-flex w-full overflow-hidden rounded-pill border border-line bg-surface-2 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={[
              "flex flex-1 items-center justify-center gap-2 rounded-pill px-3 py-2 text-sm font-bold transition-colors",
              tab === t.id
                ? "bg-accent text-on-accent"
                : "text-text-soft hover:text-text",
            ].join(" ")}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Panel Quiénes somos */}
      {tab === "nosotros" && (
        <div className="flex flex-col gap-5">
          <Card className="overflow-hidden">
            {settings.nosotrosImagen ? (
              <div className="h-64 w-full overflow-hidden sm:h-80">
                <img
                  src={settings.nosotrosImagen}
                  alt={negocio}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-52 flex-col items-center justify-center gap-3 border-b border-line bg-surface-2 text-center text-text-soft">
                <ImageOff size={28} aria-hidden="true" />
                <p className="max-w-[26ch] text-sm">
                  Cargá una imagen institucional desde Configuración.
                </p>
              </div>
            )}
            <CardBody className="flex flex-col gap-3">
              <h2 className="text-lg font-bold tracking-tight">{negocio}</h2>
              <p className="text-sm leading-6 text-text-soft">
                {nosotrosTexto}
              </p>
            </CardBody>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <SectionCard
              title="Stock real"
              icon={<PackageCheck size={18} aria-hidden="true" />}
            >
              <p>
                Lo publicado sale del inventario actual. Sin stock el producto
                se oculta solo.
              </p>
            </SectionCard>
            <SectionCard
              title="Atención directa"
              icon={<MessageCircle size={18} aria-hidden="true" />}
            >
              <p>
                Coordinamos cada pedido por WhatsApp: variantes, entrega y
                disponibilidad en un solo canal.
              </p>
            </SectionCard>
          </div>
        </div>
      )}

      {/* Panel Contacto */}
      {tab === "contacto" && (
        <div className="flex flex-col gap-5">
          <Card>
            <CardBody className="flex flex-col gap-4">
              <h2 className="text-lg font-bold tracking-tight">
                {contactoTitulo}
              </h2>
              <p className="text-sm leading-6 text-text-soft">
                {contactoTexto}
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                {whatsappHref ? (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-line bg-surface-2 p-4 transition-colors hover:border-line-strong"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
                      <MessageCircle size={20} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-bold">WhatsApp</p>
                      <p className="text-xs text-text-soft">
                        {whatsapp || "Ver número"}
                      </p>
                    </div>
                  </a>
                ) : (
                  <div className="flex items-center gap-3 rounded-lg border border-line bg-surface-2 p-4 opacity-50">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-text-soft">
                      <MessageCircle size={20} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-bold">WhatsApp</p>
                      <p className="text-xs text-text-soft">No configurado</p>
                    </div>
                  </div>
                )}

                {instagramHref ? (
                  <a
                    href={instagramHref}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-line bg-surface-2 p-4 transition-colors hover:border-line-strong"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
                      <Instagram size={20} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-bold">Instagram</p>
                      <p className="text-xs text-text-soft">Ver perfil</p>
                    </div>
                  </a>
                ) : null}

                {telefono ? (
                  <div className="flex items-center gap-3 rounded-lg border border-line bg-surface-2 p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-text-soft border border-line">
                      <Phone size={20} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-bold">Teléfono</p>
                      <p className="text-xs text-text-soft">{telefono}</p>
                    </div>
                  </div>
                ) : null}

                {direccion ? (
                  <div className="flex items-center gap-3 rounded-lg border border-line bg-surface-2 p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-text-soft border border-line">
                      <MapPin size={20} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-bold">Dirección</p>
                      <p className="text-xs text-text-soft">{direccion}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Panel Ubicación */}
      {tab === "ubicacion" && (
        <div className="flex flex-col gap-5">
          {hasCoords ? (
            <Card className="overflow-hidden">
              <LeafletMap
                lat={settings.mapLat}
                lon={settings.mapLon}
                zoom={17}
                interactive={false}
                className="h-[420px] w-full sm:h-[520px]"
              />
            </Card>
          ) : googleEmbedSrc ? (
            <Card className="overflow-hidden">
              <iframe
                title="Ubicación en Google Maps"
                src={googleEmbedSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[420px] w-full border-0 sm:h-[520px]"
              />
            </Card>
          ) : (
            <Card>
              <CardBody className="flex flex-col items-center gap-3 py-12 text-center text-text-soft">
                <MapPin size={32} aria-hidden="true" />
                <p className="font-bold">Ubicación no configurada</p>
                <p className="max-w-[36ch] text-sm">
                  El admin puede marcar la ubicación exacta del local desde el
                  panel de Configuración.
                </p>
              </CardBody>
            </Card>
          )}

          {mapsAppHref ? (
            <div className="flex justify-start">
              <a href={mapsAppHref} target="_blank" rel="noreferrer">
                <Button>
                  <MapPin size={16} aria-hidden="true" /> Abrir en Google Maps
                </Button>
              </a>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function ContactoPage() {
  const { settings } = useBusinessSettings();
  const [mensaje, setMensaje] = useState("");
  const facebookHref = "https://www.facebook.com/conectateconti/?locale=es_LA";
  const whatsapp = settings.whatsapp?.replace(/\D/g, "") ?? "";
  const whatsappHref = whatsapp ? `https://wa.me/${whatsapp}` : undefined;
  const instagramHref = settings.instagram?.trim() || "";
  const direccionConfigurada = settings.direccion?.trim() || "";
  const telefono =
    settings.telefono?.trim() ||
    settings.whatsapp?.trim() ||
    "Sin teléfono configurado";
  const direccion = direccionConfigurada || "Sin dirección configurada";
  const hasCoords = settings.mapLat != null && settings.mapLon != null;
  const mapsAppHref = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${settings.mapLat},${settings.mapLon}`
    : direccionConfigurada
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccionConfigurada)}`
      : "";
  const contactoTexto =
    settings.contactoTexto ??
    "Podés escribirnos para consultar disponibilidad, compatibilidad, medios de pago o coordinar un pedido armado desde el carrito.";
  const mensajeFinal = mensaje.trim() || "Hola, quiero hacer una consulta.";
  const whatsappMensajeHref = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensajeFinal)}`
    : undefined;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Contacto"
        title="Tecnologia importada"
        description={contactoTexto}
        centered
      />

      <Card>
        <CardBody className="flex flex-col gap-3">
          <h2 className="text-center text-lg font-bold tracking-tight">
            Escribinos un mensaje
          </h2>
          <p className="text-sm text-text-soft">
            Podés enviarnos un comentario o consulta y abrirlo directo en
            WhatsApp.
          </p>
          <Textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            rows={4}
            placeholder="Ejemplo: Hola, quería consultar disponibilidad y precio del producto..."
          />
          {whatsappMensajeHref ? (
            <div className="flex justify-end">
              <a
                href={whatsappMensajeHref}
                target="_blank"
                rel="noreferrer"
                title="Enviar mensaje por Whatsapp"
                aria-label="Enviar mensaje por Whatsapp"
              >
                <Button
                  aria-label="Enviar por Whatsapp"
                  title="Enviar por Whatsapp"
                >
                  <Send size={16} aria-hidden="true" />
                </Button>
              </a>
            </div>
          ) : (
            <div className="flex justify-end">
              <Button disabled>Whatsapp no configurado</Button>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard
          title="Información útil"
          icon={<Phone size={18} aria-hidden="true" />}
        >
          <p>Teléfono: {telefono}</p>
          <p>Dirección: {direccion}</p>
          {mapsAppHref ? (
            <p>
              <a
                href={mapsAppHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:brightness-110"
              >
                <MapPin size={16} aria-hidden="true" /> Abrir en Google Maps
              </a>
            </p>
          ) : null}
          <p>
            Si ya armaste tu carrito, confirmalo primero. Eso nos deja el
            detalle del pedido en el panel y acelera la respuesta.
          </p>
        </SectionCard>

        <SectionCard title="Redes" icon={<Instagram size={18} aria-hidden="true" />}>
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-center gap-4">
            {whatsappHref ? (
              <a href={whatsappHref} target="_blank" rel="noreferrer">
                <Button
                  variant="ghost"
                  className="h-16 w-16 rounded-2xl p-0"
                  aria-label="Whatsapp"
                  title="Whatsapp"
                >
                  <MessageCircle size={26} aria-hidden="true" />
                  <span className="sr-only">Whatsapp</span>
                </Button>
              </a>
            ) : (
              <Button
                variant="ghost"
                disabled
                className="h-16 w-16 rounded-2xl p-0"
                aria-label="Whatsapp no configurado"
                title="Whatsapp no configurado"
              >
                <MessageCircle size={26} aria-hidden="true" />
                <span className="sr-only">Whatsapp no configurado</span>
              </Button>
            )}

            {instagramHref ? (
              <a href={instagramHref} target="_blank" rel="noreferrer">
                <Button
                  variant="ghost"
                  className="h-16 w-16 rounded-2xl p-0"
                  aria-label="Instagram"
                  title="Instagram"
                >
                  <Instagram size={26} aria-hidden="true" />
                  <span className="sr-only">Instagram</span>
                </Button>
              </a>
            ) : null}

            <a href={facebookHref} target="_blank" rel="noreferrer">
              <Button
                variant="ghost"
                className="h-16 w-16 rounded-2xl p-0"
                aria-label="Facebook"
                title="Facebook"
              >
                <Facebook size={26} aria-hidden="true" />
                <span className="sr-only">Facebook</span>
              </Button>
            </a>

            {mapsAppHref ? (
              <a href={mapsAppHref} target="_blank" rel="noreferrer">
                <Button
                  variant="ghost"
                  className="h-16 w-16 rounded-2xl p-0"
                  aria-label="Google Maps"
                  title="Google Maps"
                >
                  <MapPin size={26} aria-hidden="true" />
                  <span className="sr-only">Google Maps</span>
                </Button>
              </a>
            ) : null}
            </div>

            <div className="flex justify-center">
              <ButtonLink to="/nosotros">Ver Nosotros</ButtonLink>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

export function EnviosPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Envios"
        title="Retiro o envio segun el tipo de compra."
        description="Cada venta permite elegir retiro o envio. El costo se confirma al cerrar la operacion y siempre queda visible en el resumen final."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SectionCard
          title="Retiro"
          icon={<Store size={18} aria-hidden="true" />}
        >
          <p>
            Si elegís retiro, coordinamos dia y horario por WhatsApp una vez
            confirmada la consulta o la venta.
          </p>
        </SectionCard>
        <SectionCard
          title="Envio"
          icon={<Truck size={18} aria-hidden="true" />}
        >
          <p>
            El costo de envio se define al registrar la venta. Siempre se
            informa antes del cierre y queda reflejado en el comprobante
            interno.
          </p>
        </SectionCard>
        <SectionCard
          title="Seguimiento"
          icon={<PackageCheck size={18} aria-hidden="true" />}
        >
          <p>
            Usamos el canal de WhatsApp para seguimiento y confirmacion. Si hay
            cambios de stock o variante, se informan antes de concretar.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}

export function FaqPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="FAQ"
        title="Preguntas frecuentes antes de comprar."
        description="Respuestas cortas a las dudas mas comunes para mantener la tienda simple y clara en mobile y desktop."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title="¿Necesito cuenta para comprar?">
          <p>
            No. El carrito funciona sin registro. Solo pedimos nombre y celular
            al confirmar.
          </p>
        </SectionCard>
        <SectionCard title="¿El stock es real?">
          <p>
            Si. La tienda publica muestra productos activos con stock disponible
            cargado desde el panel.
          </p>
        </SectionCard>
        <SectionCard title="¿Se puede consultar por WhatsApp?">
          <p>
            Si. El checkout abre WhatsApp con el detalle y también podés
            escribirnos directo desde la sección de contacto.
          </p>
        </SectionCard>
        <SectionCard title="¿Puedo pedir envio?">
          <p>
            Si. El costo se confirma al cerrar la venta y queda sumado en el
            resumen correspondiente.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}

export function LegalesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Legales"
        title="Condiciones basicas de uso, privacidad y disponibilidad."
        description="Texto resumido para la etapa actual del proyecto, alineado con el flujo real de carrito, pedido y atencion por WhatsApp."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard
          title="Privacidad"
          icon={<ShieldCheck size={18} aria-hidden="true" />}
        >
          <p>
            Los datos solicitados al confirmar un pedido se usan para responder
            la consulta, coordinar la venta y mantener el historial operativo
            del negocio.
          </p>
        </SectionCard>
        <SectionCard
          title="Precios y stock"
          icon={<Store size={18} aria-hidden="true" />}
        >
          <p>
            La publicacion depende del stock actual. En productos con precio
            variable o consulta manual, la confirmacion final se hace por
            WhatsApp.
          </p>
        </SectionCard>
        <SectionCard
          title="Pedidos"
          icon={<PackageCheck size={18} aria-hidden="true" />}
        >
          <p>
            Confirmar el carrito genera una consulta y no descuenta stock por si
            sola. La reserva efectiva se concreta al cerrar la venta.
          </p>
        </SectionCard>
        <SectionCard
          title="Canales de contacto"
          icon={<MessageCircle size={18} aria-hidden="true" />}
        >
          <p>
            La atencion comercial y el seguimiento de cada pedido se realizan
            por WhatsApp y desde el panel interno del negocio.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
