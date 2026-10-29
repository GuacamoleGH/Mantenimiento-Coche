using Microsoft.AspNetCore.Mvc.ModelBinding;
using System.Globalization;
using System.Text.RegularExpressions;

namespace CarCareTracker.Helper
{
    public class CustomDecimalModelBinder : IModelBinder
    {
        public Task BindModelAsync(ModelBindingContext bindingContext)
        {
            if (bindingContext == null)
            {
                throw new ArgumentNullException(nameof(bindingContext));
            }

            var valueProviderResult = bindingContext.ValueProvider.GetValue(bindingContext.ModelName);
            if (valueProviderResult == ValueProviderResult.None)
            {
                return Task.CompletedTask;
            }

            bindingContext.ModelState.SetModelValue(bindingContext.ModelName, valueProviderResult);

            var valueAsString = valueProviderResult.FirstValue?.Trim();
            if (string.IsNullOrWhiteSpace(valueAsString))
            {
                if (bindingContext.ModelType == typeof(decimal?))
                {
                    bindingContext.Result = ModelBindingResult.Success(null);
                }
                else
                {
                    bindingContext.Result = ModelBindingResult.Success(0m);
                }
                return Task.CompletedTask;
            }

            // Normalización para soportar tanto '.' como ',' independientemente de la cultura del servidor
            // Si contiene tanto punto como coma (ej. 1.234,56 o 1,234.56)
            if (valueAsString.Contains('.') && valueAsString.Contains(','))
            {
                if (valueAsString.LastIndexOf(',') > valueAsString.LastIndexOf('.'))
                {
                    // Formato europeo: 1.234,56 -> quitar punto miles y cambiar coma por punto
                    valueAsString = valueAsString.Replace(".", "").Replace(',', '.');
                }
                else
                {
                    // Formato US: 1,234.56 -> quitar coma miles
                    valueAsString = valueAsString.Replace(",", "");
                }
            }
            else if (valueAsString.Contains(','))
            {
                // Solo contiene coma (ej: 33,78) -> convertir a punto para InvariantCulture
                valueAsString = valueAsString.Replace(',', '.');
            }
            // Si solo contiene punto (ej: 33.78) -> ya es decimal estándar para InvariantCulture

            // Quitar cualquier carácter que no sea dígito, punto o signo negativo
            valueAsString = Regex.Replace(valueAsString, @"[^\d.-]", "");

            if (decimal.TryParse(valueAsString, NumberStyles.Any, CultureInfo.InvariantCulture, out var decimalValue))
            {
                bindingContext.Result = ModelBindingResult.Success(decimalValue);
            }
            else
            {
                bindingContext.ModelState.TryAddModelError(bindingContext.ModelName, "Valor decimal no válido.");
            }

            return Task.CompletedTask;
        }
    }

    public class CustomDecimalModelBinderProvider : IModelBinderProvider
    {
        public IModelBinder? GetBinder(ModelBinderProviderContext context)
        {
            if (context == null)
            {
                throw new ArgumentNullException(nameof(context));
            }

            if (context.Metadata.ModelType == typeof(decimal) || context.Metadata.ModelType == typeof(decimal?))
            {
                return new CustomDecimalModelBinder();
            }

            return null;
        }
    }
}
