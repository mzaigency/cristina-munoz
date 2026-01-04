import { useState, useEffect, useMemo } from "react";
import { Country, State, City as CSCity } from "country-state-city";
import { cities as getSpanishCities, provinces as getSpanishProvinces } from "all-spanish-cities";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

interface LocationSelectorProps {
  onCountryChange: (country: string) => void;
  onProvinceChange: (province: string) => void;
  onCityChange: (city: string) => void;
  defaultCountry?: string;
  defaultProvince?: string;
  defaultCity?: string;
  errors?: {
    country?: string;
    province?: string;
    city?: string;
  };
}

export function LocationSelector({
  onCountryChange,
  onProvinceChange,
  onCityChange,
  defaultCountry = "",
  defaultProvince = "",
  defaultCity = "",
  errors,
}: LocationSelectorProps) {
  const [selectedCountry, setSelectedCountry] = useState(defaultCountry);
  const [selectedProvince, setSelectedProvince] = useState(defaultProvince);
  const [selectedCity, setSelectedCity] = useState(defaultCity);
  const [citySearch, setCitySearch] = useState("");

  // Get all countries
  const countries = useMemo(() => Country.getAllCountries(), []);

  // Get provinces/states based on selected country
  const provinces = useMemo(() => {
    if (!selectedCountry) return [];
    
    if (selectedCountry === "ES") {
      // For Spain, use all-spanish-cities provinces
      const spanishProvinces = getSpanishProvinces();
      return spanishProvinces
        .map((p) => ({
          isoCode: p.code,
          name: p.name,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, 'es'));
    }
    
    // For other countries, use country-state-city
    return State.getStatesOfCountry(selectedCountry);
  }, [selectedCountry]);

  // Get cities based on selected country and province
  const cities = useMemo(() => {
    if (!selectedCountry || !selectedProvince) return [];
    
    if (selectedCountry === "ES") {
      // For Spain, use all-spanish-cities - pass code_province as filter
      const spanishCitiesData = getSpanishCities({ code_province: selectedProvince });
      return spanishCitiesData
        .map((city) => ({
          name: city.name,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, 'es'));
    }
    
    // For other countries, use country-state-city
    return CSCity.getCitiesOfState(selectedCountry, selectedProvince);
  }, [selectedCountry, selectedProvince]);

  // Filter cities by search
  const filteredCities = useMemo(() => {
    if (!citySearch) return cities;
    const searchLower = citySearch.toLowerCase();
    return cities.filter((city) =>
      city.name.toLowerCase().includes(searchLower)
    );
  }, [cities, citySearch]);

  // Reset province and city when country changes
  useEffect(() => {
    if (selectedCountry !== defaultCountry) {
      setSelectedProvince("");
      setSelectedCity("");
      setCitySearch("");
      onProvinceChange("");
      onCityChange("");
    }
  }, [selectedCountry]);

  // Reset city when province changes
  useEffect(() => {
    if (selectedProvince !== defaultProvince) {
      setSelectedCity("");
      setCitySearch("");
      onCityChange("");
    }
  }, [selectedProvince]);

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    const country = countries.find((c) => c.isoCode === value);
    onCountryChange(country?.name || "");
  };

  const handleProvinceChange = (value: string) => {
    setSelectedProvince(value);
    const province = provinces.find((p) => p.isoCode === value);
    onProvinceChange(province?.name || "");
  };

  const handleCityChange = (value: string) => {
    setSelectedCity(value);
    onCityChange(value);
  };

  return (
    <div className="space-y-4">
      {/* Country Selector */}
      <div className="space-y-2">
        <Label htmlFor="country" className="text-foreground">
          País *
        </Label>
        <Select value={selectedCountry} onValueChange={handleCountryChange}>
          <SelectTrigger 
            id="country"
            className={`h-12 bg-background border-input ${errors?.country ? "border-destructive" : ""}`}
          >
            <SelectValue placeholder="Selecciona un país" />
          </SelectTrigger>
          <SelectContent className="bg-background border-input max-h-[300px] z-50">
            {countries.map((country) => (
              <SelectItem 
                key={country.isoCode} 
                value={country.isoCode}
                className="py-3"
              >
                {country.flag} {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors?.country && (
          <p className="text-sm text-destructive">{errors.country}</p>
        )}
      </div>

      {/* Province/State Selector */}
      <div className="space-y-2">
        <Label htmlFor="province" className="text-foreground">
          Provincia / Estado *
        </Label>
        <Select 
          value={selectedProvince} 
          onValueChange={handleProvinceChange}
          disabled={!selectedCountry}
        >
          <SelectTrigger 
            id="province"
            className={`h-12 bg-background border-input ${errors?.province ? "border-destructive" : ""}`}
          >
            <SelectValue placeholder={selectedCountry ? "Selecciona una provincia" : "Primero selecciona un país"} />
          </SelectTrigger>
          <SelectContent className="bg-background border-input max-h-[300px] z-50">
            {provinces.map((province) => (
              <SelectItem 
                key={province.isoCode} 
                value={province.isoCode}
                className="py-3"
              >
                {province.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors?.province && (
          <p className="text-sm text-destructive">{errors.province}</p>
        )}
      </div>

      {/* City Selector with Search */}
      <div className="space-y-2">
        <Label htmlFor="city" className="text-foreground">
          Ciudad / Municipio *
        </Label>
        <Select 
          value={selectedCity} 
          onValueChange={handleCityChange}
          disabled={!selectedProvince}
        >
          <SelectTrigger 
            id="city"
            className={`h-12 bg-background border-input ${errors?.city ? "border-destructive" : ""}`}
          >
            <SelectValue placeholder={selectedProvince ? "Selecciona una ciudad" : "Primero selecciona una provincia"} />
          </SelectTrigger>
          <SelectContent className="bg-background border-input z-50">
            {/* Search Input */}
            {cities.length > 20 && (
              <div className="sticky top-0 p-2 bg-background border-b border-input">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar ciudad..."
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    className="pl-9 h-10 bg-background"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}
            <div className="max-h-[250px] overflow-y-auto">
              {filteredCities.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No se encontraron ciudades
                </div>
              ) : (
                filteredCities.map((city, index) => (
                  <SelectItem 
                    key={`${city.name}-${index}`} 
                    value={city.name}
                    className="py-3"
                  >
                    {city.name}
                  </SelectItem>
                ))
              )}
            </div>
          </SelectContent>
        </Select>
        {errors?.city && (
          <p className="text-sm text-destructive">{errors.city}</p>
        )}
      </div>
    </div>
  );
}
