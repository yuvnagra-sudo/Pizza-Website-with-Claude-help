import { useEffect, useRef, useState } from "react";
import { MapView } from "./Map";

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Enter your delivery address...",
  className = "",
  required = false,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize autocomplete when map is ready
  const handleMapReady = (map: google.maps.Map) => {
    if (!inputRef.current) return;

    // Create autocomplete instance
    const autocompleteInstance = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "ca" }, // Restrict to Canada
      fields: ["formatted_address", "address_components"],
      types: ["address"],
    });

    // Listen for place selection
    autocompleteInstance.addListener("place_changed", () => {
      const place = autocompleteInstance.getPlace();
      if (place.formatted_address) {
        onChange(place.formatted_address);
      }
    });

    setAutocomplete(autocompleteInstance);
    setMapReady(true);
  };

  // Clean up autocomplete on unmount
  useEffect(() => {
    return () => {
      if (autocomplete) {
        google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, [autocomplete]);

  return (
    <div className="relative">
      {/* Hidden map to initialize Google Maps API */}
      <div className="hidden">
        <MapView onMapReady={handleMapReady} />
      </div>

      {/* Address input field */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        required={required}
        disabled={!mapReady}
        autoComplete="street-address"
        name="address"
      />

      {!mapReady && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
          Loading...
        </div>
      )}
    </div>
  );
}
