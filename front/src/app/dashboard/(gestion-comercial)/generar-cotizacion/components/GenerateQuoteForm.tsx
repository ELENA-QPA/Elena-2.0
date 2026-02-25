"use client";

import {
  Button,
  Calendar,
  Checkbox,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,  
} from "@/components";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, X, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useCreateQuote, useUpdateQuote } from "../../api/useQuotes";
import { currencyUSD, toTitleCase } from "../lib/formatters";
import { Textarea } from "@/components/ui/textarea";
import {
  generateQuoteId,
  handleAddPhone,
  handleRemovePhone,
} from "../lib/helperFunctions";
import { LICENSE_BILLING_PERIOD, TECHNOLOGY_LABELS, TECHNOLOGY_OPTIONS } from "../types/quotes.types";
import { QuoteFormValues, quoteResolver } from "../validations";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useGetQuoteById } from "../../api/useQuotes";
import { pushTimelineEvent } from "../../api/quotes.service";

// ── NUEVO: Módulos predefinidos ──────────────────────────────────────────────

const MODULE_OPTIONS = [
  { value: "production", label: "Producción" },
  { value: "inventory", label: "Inventarios y Stock" },
  { value: "purchasing", label: "Compras" },
  { value: "commercial", label: "Gestión Comercial" },
  { value: "hr", label: "Talento Humano" },
  { value: "analytics", label: "Tableros y Analítica" },
] as const;

export function GenerateQuoteForm() {
  const router = useRouter();
  const { mutate, isPending } = useCreateQuote();
  const { mutate: mutateUpdate, isPending: isUpdating } = useUpdateQuote();

  const form = useForm<QuoteFormValues>({
    resolver: quoteResolver,
    mode: "onChange",
    defaultValues: {
      quoteId: generateQuoteId(),
      companyName: "",
      phones: [NaN],
      includeLicenses: false,
      standardLicenses: { unitPrice: 108 },
      premiumLicenses: { unitPrice: 120 },
      // NUEVO: defaults para campos nuevos
      notificationEmails: [],
      includedModules: [],
      licenseBillingPeriod: LICENSE_BILLING_PERIOD.MONTHLY,
    },
  });

  // Detectar modo edición
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const { data: existingQuote, isLoading: isLoadingQuote } =
    useGetQuoteById(editId);
  const isEditMode = !!editId;
  const hasTrackedResume = useRef(false);

  // Cargar datos existentes cuando se obtienen
  useEffect(() => {
    if (existingQuote && isEditMode && editId) {
      form.reset({
        quoteId: existingQuote.quoteId,
        companyName: existingQuote.companyName,
        nit: existingQuote.nit,
        industry: existingQuote.industry,
        operationType: existingQuote.operationType,
        totalWorkers: existingQuote.totalWorkers,
        productionWorkers: existingQuote.productionWorkers,
        contactName: existingQuote.contactName,
        contactPosition: existingQuote.contactPosition,
        email: existingQuote.email,
        phones: existingQuote.phones,
        currentTechnology: existingQuote.currentTechnology,
        otherTechnologyDetail: existingQuote.otherTechnologyDetail,
        includeLicenses: existingQuote.includeLicenses,
        standardLicenses: existingQuote.standardLicenses ?? { unitPrice: 108 },
        premiumLicenses: existingQuote.premiumLicenses ?? { unitPrice: 120 },
        implementationPriceUSD: existingQuote.implementationPriceUSD,
        estimatedStartDate: existingQuote.estimatedStartDate
          ? new Date(
              String(existingQuote.estimatedStartDate).replace(
                "T00:00:00.000Z",
                "T12:00:00",
              ),
            )
          : undefined,
        // NUEVO: cargar campos nuevos en edición
        companyAddress: existingQuote.companyAddress ?? "",
        notificationEmails: existingQuote.notificationEmails ?? [],
        numberOfLocations: existingQuote.numberOfLocations,
        operationalNotes: existingQuote.operationalNotes ?? "",
        licenseBillingPeriod: existingQuote.licenseBillingPeriod ?? LICENSE_BILLING_PERIOD.MONTHLY,
        implementationDurationWeeks:
          existingQuote.implementationDurationWeeks,
        estimatedGoLiveDate: existingQuote.estimatedGoLiveDate
          ? new Date(
              String(existingQuote.estimatedGoLiveDate).replace(
                "T00:00:00.000Z",
                "T12:00:00",
              ),
            )
          : undefined,
        implementationDescription:
          existingQuote.implementationDescription ?? "",
        paymentTerms: existingQuote.paymentTerms ?? "",
        includedModules: existingQuote.includedModules ?? [],
        additionalModulesDetail:
          existingQuote.additionalModulesDetail ?? "",
        expirationDateOverride: existingQuote.expirationDateOverride
          ? new Date(
              String(existingQuote.expirationDateOverride).replace(
                "T00:00:00.000Z",
                "T12:00:00",
              ),
            )
          : undefined,
        advisorOverride: existingQuote.advisorOverride ?? {},
      });
      if (!hasTrackedResume.current) {
        hasTrackedResume.current = true;
        pushTimelineEvent(editId, {
          type: "editing_resumed",
          detail: "Edición reanudada desde el detalle",
        });
      }
    }
  }, [existingQuote, isEditMode, editId, form]);

  // Watchers
  const currentTechnology = form.watch("currentTechnology");
  const phones = form.watch("phones") ?? [1];
  const includeLicenses = form.watch("includeLicenses");
  const notificationEmails = form.watch("notificationEmails") ?? [];

  // Manejador para el envío
  const onSubmitHandler = async (values: QuoteFormValues) => {
    const payload = {
      ...values,
      companyName: values.companyName.trim(),
      contactName: toTitleCase(values.contactName.trim()),
      contactPosition: values.contactPosition.trim(),
      email: values.email.trim().toLowerCase(),
      industry: values.industry.trim(),
      otherTechnologyDetail: values.otherTechnologyDetail?.trim(),
      companyAddress: values.companyAddress?.trim(),
      operationalNotes: values.operationalNotes?.trim(),
      implementationDescription: values.implementationDescription?.trim(),
      paymentTerms: values.paymentTerms?.trim(),
      additionalModulesDetail: values.additionalModulesDetail?.trim(),
      estimatedStartDate: values.estimatedStartDate
        ?.toISOString()
        .split("T")[0],
      estimatedGoLiveDate: values.estimatedGoLiveDate
        ?.toISOString()
        .split("T")[0],
      expirationDateOverride: values.expirationDateOverride
        ?.toISOString()
        .split("T")[0],
      notificationEmails: (values.notificationEmails ?? [])
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    };

    if (isEditMode && editId) {
      mutateUpdate(
        { id: editId, payload },
        {
          onSuccess: () => {
            toast.success("¡Cotización actualizada exitosamente!");
            form.reset();
            setTimeout(
              () => router.push("/dashboard/consultar-cotizaciones"),
              2000,
            );
          },
          onError: (error: Error) => {
            toast.error(error.message || "Error al actualizar la cotización");
          },
        },
      );
    } else {
      mutate(payload, {
        onSuccess: () => {
          toast.success("¡Cotización creada exitosamente!");
          form.reset();
          setTimeout(
            () => router.push("/dashboard/consultar-cotizaciones"),
            2000,
          );
        },
        onError: (error: Error) => {
          toast.error(error.message || "Error al crear la cotización");
        },
      });
    }
  };

  // ── Helper: agregar/quitar emails de notificación ──────────────────────────

  const handleAddNotificationEmail = () => {
    const current = form.getValues("notificationEmails") ?? [];
    form.setValue("notificationEmails", [...current, ""]);
  };

  const handleRemoveNotificationEmail = (index: number) => {
    const current = form.getValues("notificationEmails") ?? [];
    form.setValue(
      "notificationEmails",
      current.filter((_, i) => i !== index),
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitHandler)}>
        {/* ════════════════════════════════════════════════════════════════════
            SECCIÓN 1: Información de la empresa
        ════════════════════════════════════════════════════════════════════ */}
        <p className="mt-5 text-md text-elena-pink-500 font-semibold">
          Información de la empresa
        </p>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-sm">Nombre:</FormLabel>
                <FormControl>
                  <Input
                    className="text-sm text-muted-foreground truncate"
                    placeholder="Nombre completo de la empresa"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nit"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-sm">Nit:</FormLabel>
                <FormControl>
                  <Input
                    inputMode="numeric"
                    type="number"
                    className="text-sm text-muted-foreground truncate"
                    placeholder="Solo dígitos numéricos, incluyendo dígito de verificación, sin guiones (-) ni puntos (.)"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-sm">
                  Industria/Sector que pertenece:
                </FormLabel>
                <FormControl>
                  <Input
                    className="text-sm text-muted-foreground truncate"
                    placeholder="Industria o sector a la que pertenece la empresa"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="operationType"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-sm">Tipo de operación:</FormLabel>
                <Select
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger className="text-sm text-muted-foreground truncate">
                      <SelectValue
                        placeholder={
                          field.value ?? "Seleccione un tipo de operación"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="make_to_order">make_to_order</SelectItem>
                    <SelectItem value="make_to_stock">make_to_stock</SelectItem>
                    <SelectItem value="hybrid">hybrid</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* NUEVO: Dirección de la empresa */}
        <div className="grid grid-cols-1 gap-4 mt-4">
          <FormField
            control={form.control}
            name="companyAddress"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-sm">
                  Dirección de la empresa:
                </FormLabel>
                <FormControl>
                  <Input
                    className="text-sm text-muted-foreground truncate"
                    placeholder="Dirección principal de la empresa"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <FormField
            control={form.control}
            name="totalWorkers"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-sm">
                  Total de trabajadores vinculados:
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    className="text-sm text-muted-foreground truncate"
                    placeholder="Total de trabajadores en la empresa"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="productionWorkers"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-sm">
                  Trabajadores en producción:
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    className="text-sm text-muted-foreground truncate"
                    placeholder="Cantidad de trabajadores en producción"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* NUEVO: Sedes y observaciones operativas */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <FormField
            control={form.control}
            name="numberOfLocations"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-sm">
                  Número de sedes o plantas:
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    className="text-sm text-muted-foreground truncate"
                    placeholder="Cantidad de sedes o plantas"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="mt-4">
          <FormField
            control={form.control}
            name="operationalNotes"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-sm">
                  Observaciones operativas:
                </FormLabel>
                <FormControl>
                  <Textarea
                    className="text-sm text-muted-foreground resize-none"
                    placeholder="Observaciones relevantes sobre la operación del cliente"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Tecnología utilizada (existente) */}
        <div className="mt-4">
          <FormField
            control={form.control}
            name="currentTechnology"
            render={() => (
              <FormItem>
                <FormLabel className="text-sm">Tecnología utilizada:</FormLabel>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {TECHNOLOGY_OPTIONS.map((option) => (
                    <FormField
                      key={option}
                      control={form.control}
                      name="currentTechnology"
                      render={({ field }) => (
                        <FormItem
                          key={option}
                          className="flex items-center space-x-2 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(option)}
                              onCheckedChange={(checked) => {
                                const current = field.value ?? [];
                                field.onChange(
                                  checked
                                    ? [...current, option]
                                    : current.filter((v: any) => v !== option),
                                );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            {TECHNOLOGY_LABELS[option]}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          {currentTechnology?.includes("other") && (
            <FormField
              control={form.control}
              name="otherTechnologyDetail"
              render={({ field }) => (
                <FormItem className="space-y-1 mt-4">
                  <FormLabel className="text-sm">
                    Especifica la otra tecnología:
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="text-sm text-muted-foreground truncate"
                      placeholder="Describe la tecnología que utilizas"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            SECCIÓN 2: Información de contacto
        ════════════════════════════════════════════════════════════════════ */}
        <p className="mt-5 text-md text-elena-pink-500 font-semibold">
          Información de contacto
        </p>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="contactName"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-sm">Nombre completo:</FormLabel>
                <FormControl>
                  <Input
                    className="text-sm text-muted-foreground truncate"
                    placeholder="Nombre del contacto de la empresa"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contactPosition"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-sm">Cargo:</FormLabel>
                <FormControl>
                  <Input
                    className="text-sm text-muted-foreground truncate"
                    placeholder="Cargo del contacto en la empresa"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-sm">Correo electrónico:</FormLabel>
                <FormControl>
                  <Input
                    className="text-sm text-muted-foreground truncate"
                    placeholder="Mail del contacto de la empresa"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phones.0"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-sm">Número principal:</FormLabel>
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        className="text-sm text-muted-foreground truncate"
                        placeholder="Número principal de contacto"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddPhone(form, phones)}
                    className="shrink-0 border-elena-pink-400 bg-elena-pink-50 text-elena-pink-600 hover:bg-elena-pink-100 hover:text-elena-pink-700"
                  >
                    Añadir
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {phones.length > 1 && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            {phones.slice(1).map((_: any, i: number) => {
              const index = i + 1;
              return (
                <FormField
                  key={index}
                  control={form.control}
                  name={`phones.${index}`}
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-sm">
                        {`Número opcional ${index}:`}
                      </FormLabel>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <FormControl>
                            <Input
                              type="number"
                              inputMode="numeric"
                              className="text-sm text-muted-foreground truncate"
                              placeholder="Número adicional de contacto"
                              {...field}
                              onChange={(e) =>
                                field.onChange(e.target.valueAsNumber)
                              }
                            />
                          </FormControl>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleRemovePhone(form, phones, index)}
                          className="shrink-0 border-elena-pink-400 bg-elena-pink-50 text-elena-pink-600 hover:bg-elena-pink-100 hover:text-elena-pink-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              );
            })}
          </div>
        )}

        {/* NUEVO: Emails de notificación */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">
              Emails de notificación contractual:
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddNotificationEmail}
              className="shrink-0 border-elena-pink-400 bg-elena-pink-50 text-elena-pink-600 hover:bg-elena-pink-100 hover:text-elena-pink-700"
            >
              <Plus className="h-3 w-3 mr-1" />
              Añadir email
            </Button>
          </div>
          {notificationEmails.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Si no se agregan, se usará el correo de contacto principal.
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">
            {notificationEmails.map((_, i) => (
              <FormField
                key={i}
                control={form.control}
                name={`notificationEmails.${i}`}
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-sm">
                      {`Email notificación ${i + 1}:`}
                    </FormLabel>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <FormControl>
                          <Input
                            type="email"
                            className="text-sm text-muted-foreground truncate"
                            placeholder="email@empresa.com"
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveNotificationEmail(i)}
                        className="shrink-0 border-elena-pink-400 bg-elena-pink-50 text-elena-pink-600 hover:bg-elena-pink-100 hover:text-elena-pink-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            SECCIÓN 3: Módulos incluidos (NUEVO)
        ════════════════════════════════════════════════════════════════════ */}
        <p className="mt-5 text-md text-elena-pink-500 font-semibold">
          Módulos incluidos
        </p>
        <div className="mt-2">
          <FormField
            control={form.control}
            name="includedModules"
            render={() => (
              <FormItem>
                <FormLabel className="text-sm">
                  Selecciona los módulos que incluye la propuesta:
                </FormLabel>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {MODULE_OPTIONS.map((mod) => (
                    <FormField
                      key={mod.value}
                      control={form.control}
                      name="includedModules"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(mod.value)}
                              onCheckedChange={(checked) => {
                                const current = field.value ?? [];
                                field.onChange(
                                  checked
                                    ? [...current, mod.value]
                                    : current.filter(
                                        (v: string) => v !== mod.value,
                                      ),
                                );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            {mod.label}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="mt-4">
          <FormField
            control={form.control}
            name="additionalModulesDetail"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-sm">
                  Módulos o funcionalidades adicionales:
                </FormLabel>
                <FormControl>
                  <Textarea
                    className="text-sm text-muted-foreground resize-none"
                    placeholder="Describe módulos o funcionalidades extras no listados arriba"
                    rows={2}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            SECCIÓN 4: Detalles de la cotización
        ════════════════════════════════════════════════════════════════════ */}
        <p className="mt-5 text-md text-elena-pink-500 font-semibold">
          Detalles de la cotización
        </p>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="estimatedStartDate"
            render={({ field }) => (
              <FormItem className="flex flex-col space-y-1">
                <FormLabel className="text-sm">
                  Fecha estimada de inicio:
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "text-sm font-normal justify-start",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value
                          ? format(field.value, "dd/MM/yyyy", { locale: es })
                          : "Seleccionar fecha de inicio"}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={{
                        before: new Date(new Date().setHours(0, 0, 0, 0)),
                      }}
                      locale={es}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="includeLicenses"
            render={({ field }) => (
              <FormItem className="flex flex-col space-y-1">
                <FormLabel className="text-sm">¿Incluir licencias?</FormLabel>
                <div
                  className={cn(
                    "flex items-center justify-between border rounded-lg px-3 h-9 transition-colors",
                    field.value
                      ? "border-elena-pink-400 bg-elena-pink-50"
                      : "border-input bg-background",
                  )}
                >
                  <span
                    className={cn(
                      "text-sm transition-colors",
                      field.value
                        ? "text-elena-pink-600 font-medium"
                        : "text-muted-foreground",
                    )}
                  >
                    {field.value
                      ? "Sí, incluir licencias"
                      : "No incluir licencias"}
                  </span>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-elena-pink-500 data-[state=unchecked]:bg-elena-pink-100"
                    />
                  </FormControl>
                </div>
              </FormItem>
            )}
          />
        </div>

        {/* Licencias (existente) */}
        {includeLicenses && (
          <>
            {/* NUEVO: Periodo de facturación */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <FormField
                control={form.control}
                name="licenseBillingPeriod"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-sm">
                      Periodo de facturación:
                    </FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="text-sm text-muted-foreground">
                          <SelectValue placeholder="Seleccionar periodo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">Mensual</SelectItem>
                        <SelectItem value="annual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <p className="mt-5 text-sm text-muted-foreground font-medium">
              Licencias estándar
            </p>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <FormField
                control={form.control}
                name="standardLicenses.quantity"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-sm">Cantidad:</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={1}
                        className="text-sm text-muted-foreground"
                        placeholder="Cantidad de licencias estándar"
                        onChange={(e) => {
                          const qty = e.target.valueAsNumber;
                          field.onChange(qty);
                          const unitPrice = form.getValues(
                            "standardLicenses.unitPrice",
                          );
                          if (!isNaN(qty) && unitPrice) {
                            form.setValue(
                              "standardLicenses.totalLicensesPrice",
                              qty * unitPrice,
                              { shouldValidate: false },
                            );
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="standardLicenses.unitPrice"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-sm">
                      Precio por licencia (USD):
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        inputMode="numeric"
                        className="text-sm text-muted-foreground"
                        placeholder="Precio mínimo $108"
                        value={
                          field.value ? currencyUSD(Number(field.value)) : ""
                        }
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(/\D/g, "");
                          const price = rawValue ? Number(rawValue) : undefined;
                          field.onChange(price ?? "");
                          const qty = form.getValues(
                            "standardLicenses.quantity",
                          );
                          if (price && qty && !isNaN(qty)) {
                            form.setValue(
                              "standardLicenses.totalLicensesPrice",
                              qty * price,
                              { shouldValidate: false },
                            );
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="standardLicenses.totalLicensesPrice"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-sm">
                      Precio total estándar (USD):
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        readOnly
                        type="text"
                        className="text-sm text-muted-foreground bg-muted cursor-default"
                        placeholder="Se calcula automáticamente"
                        value={
                          field.value ? currencyUSD(Number(field.value)) : ""
                        }
                        onChange={() => {}}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <p className="mt-4 text-sm text-muted-foreground font-medium">
              Licencias premium
            </p>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <FormField
                control={form.control}
                name="premiumLicenses.quantity"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-sm">Cantidad:</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={1}
                        className="text-sm text-muted-foreground"
                        placeholder="Cantidad de licencias premium"
                        onChange={(e) => {
                          const qty = e.target.valueAsNumber;
                          field.onChange(qty);
                          const unitPrice = form.getValues(
                            "premiumLicenses.unitPrice",
                          );
                          if (!isNaN(qty) && unitPrice) {
                            form.setValue(
                              "premiumLicenses.totalLicensesPrice",
                              qty * unitPrice,
                              { shouldValidate: false },
                            );
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="premiumLicenses.unitPrice"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-sm">
                      Precio por licencia (USD):
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        inputMode="numeric"
                        className="text-sm text-muted-foreground"
                        placeholder="Precio mínimo $120"
                        value={
                          field.value ? currencyUSD(Number(field.value)) : ""
                        }
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(/\D/g, "");
                          const price = rawValue ? Number(rawValue) : undefined;
                          field.onChange(price ?? "");
                          const qty = form.getValues(
                            "premiumLicenses.quantity",
                          );
                          if (price && qty && !isNaN(qty)) {
                            form.setValue(
                              "premiumLicenses.totalLicensesPrice",
                              qty * price,
                              { shouldValidate: false },
                            );
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="premiumLicenses.totalLicensesPrice"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-sm">
                      Precio total premium (USD):
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        readOnly
                        type="text"
                        className="text-sm text-muted-foreground bg-muted cursor-default"
                        placeholder="Se calcula automáticamente"
                        value={
                          field.value ? currencyUSD(Number(field.value)) : ""
                        }
                        onChange={() => {}}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        )}

        {/* Implementación */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <FormField
            control={form.control}
            name="implementationPriceUSD"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-sm">
                  Precio de implementación (USD):
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    inputMode="numeric"
                    className="text-sm text-muted-foreground"
                    placeholder="Precio de implementación"
                    value={
                      field.value !== undefined &&
                      field.value !== null &&
                      !isNaN(Number(field.value))
                        ? currencyUSD(Number(field.value))
                        : ""
                    }
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/\D/g, "");
                      field.onChange(rawValue ? Number(rawValue) : undefined);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* NUEVO: Duración de implementación */}
          <FormField
            control={form.control}
            name="implementationDurationWeeks"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-sm">
                  Duración estimada (semanas):
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    className="text-sm text-muted-foreground"
                    placeholder="Duración en semanas"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* NUEVO: Go-Live, forma de pago, descripción */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <FormField
            control={form.control}
            name="estimatedGoLiveDate"
            render={({ field }) => (
              <FormItem className="flex flex-col space-y-1">
                <FormLabel className="text-sm">
                  Fecha estimada de Go-Live:
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "text-sm font-normal justify-start",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value
                          ? format(field.value, "dd/MM/yyyy", { locale: es })
                          : "Seleccionar fecha de Go-Live"}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={{
                        before: new Date(new Date().setHours(0, 0, 0, 0)),
                      }}
                      locale={es}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="paymentTerms"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-sm">Forma de pago:</FormLabel>
                <FormControl>
                  <Input
                    className="text-sm text-muted-foreground"
                    placeholder="Ej: 50% al inicio, 50% en Go-Live"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="mt-4">
          <FormField
            control={form.control}
            name="implementationDescription"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-sm">
                  Descripción de implementación (para propuesta):
                </FormLabel>
                <FormControl>
                  <Textarea
                    className="text-sm text-muted-foreground resize-none"
                    placeholder="Descripción del servicio de implementación que aparecerá en la propuesta comercial"
                    rows={2}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            SECCIÓN 5: Fecha de vencimiento (NUEVO)
        ════════════════════════════════════════════════════════════════════ */}
        <p className="mt-5 text-md text-elena-pink-500 font-semibold">
          Vencimiento y asesor
        </p>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="expirationDateOverride"
            render={({ field }) => (
              <FormItem className="flex flex-col space-y-1">
                <FormLabel className="text-sm">
                  Fecha de vencimiento (opcional):
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "text-sm font-normal justify-start",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value
                          ? format(field.value, "dd/MM/yyyy", { locale: es })
                          : "Auto: emisión + 30 días"}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={{
                        before: new Date(new Date().setHours(0, 0, 0, 0)),
                      }}
                      locale={es}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  Si no seleccionas fecha, se calcula automáticamente como fecha
                  de emisión + 30 días
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* NUEVO: Asesor override */}
        <p className="mt-4 text-sm text-muted-foreground font-medium">
          Asesor Quanta (se toma del usuario logueado; completa solo si deseas
          sobreescribir)
        </p>
        <div className="grid grid-cols-3 gap-4 mt-2">
          <FormField
            control={form.control}
            name="advisorOverride.name"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-sm">Nombre del asesor:</FormLabel>
                <FormControl>
                  <Input
                    className="text-sm text-muted-foreground"
                    placeholder="Nombre (vacío = usuario actual)"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="advisorOverride.position"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-sm">Cargo del asesor:</FormLabel>
                <FormControl>
                  <Input
                    className="text-sm text-muted-foreground"
                    placeholder="Cargo (vacío = usuario actual)"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="advisorOverride.email"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-sm">Email del asesor:</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    className="text-sm text-muted-foreground"
                    placeholder="Email (vacío = usuario actual)"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            SUBMIT
        ════════════════════════════════════════════════════════════════════ */}
        <Button
          className="mt-6"
          type="submit"
          disabled={isPending || isUpdating || isLoadingQuote}
        >
          {isPending || isUpdating
            ? isEditMode
              ? "Actualizando..."
              : "Creando..."
            : isEditMode
              ? "Actualizar cotización"
              : "Generar cotización"}
        </Button>
      </form>
    </Form>
  );
}