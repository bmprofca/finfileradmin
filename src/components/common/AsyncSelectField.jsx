import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Select from "react-select";
import { useTheme } from "../../contexts/ThemeContext";
import { getReactSelectMenuProps, getReactSelectStyles } from "../../hooks/reactSelectConfig";
import apiCall from "../../utils/apiCall";

const mergeSelectStyles = (baseStyles, styles = {}, theme = "light") => {
  const customStyles = styles || {};
  const keys = new Set([...Object.keys(baseStyles), ...Object.keys(customStyles)]);

  const merged = {};
  keys.forEach((key) => {
    const baseStyle = baseStyles[key];
    const overrideStyle = customStyles[key];

    if (baseStyle && overrideStyle) {
      merged[key] = (provided, state) => overrideStyle(baseStyle(provided, state), state, theme);
    } else {
      merged[key] = overrideStyle || baseStyle;
    }
  });

  return merged;
};

const AsyncSelectField = ({
  fetchUrl,
  dataKey,
  labelKey,
  valueKey,
  formatOptionLabel,
  styles,
  placeholder = "Search...",
  value,
  onChange,
  ...props
}) => {
  const { theme } = useTheme();
  const mergedStyles = useMemo(
    () => mergeSelectStyles(getReactSelectStyles(theme), styles, theme),
    [theme, styles]
  );

  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [hasMore, setHasMore] = useState(true);
  
  const searchTimeout = useRef(null);
  const fetchController = useRef(null);

  const loadOptions = useCallback(async (pageNum, searchQuery, isNewSearch = false) => {
    if (fetchController.current) {
      fetchController.current.abort();
    }
    fetchController.current = new AbortController();

    setLoading(true);
    try {
      const separator = fetchUrl.includes("?") ? "&" : "?";
      const url = `${fetchUrl}${separator}page_no=${pageNum}&limit=20&search=${encodeURIComponent(searchQuery)}`;
      
      const res = await apiCall(url, "GET");
      const data = await res.json();
      
      if (data.success) {
        const rawItems = dataKey ? data.data[dataKey] : data.data;
        const items = Array.isArray(rawItems) ? rawItems : [];
        
        const newOptions = items.map(item => ({
          ...item,
          value: item[valueKey],
          label: typeof labelKey === 'function' ? labelKey(item) : item[labelKey],
        }));

        setOptions(prev => isNewSearch ? newOptions : [...prev, ...newOptions]);
        
        if (items.length < 20) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("AsyncSelectField fetch error:", error);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchUrl, dataKey, labelKey, valueKey]);

  useEffect(() => {
    loadOptions(1, "", true);
  }, [loadOptions]);

  const handleMenuScrollToBottom = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadOptions(nextPage, search, false);
    }
  };

  const handleInputChange = (inputValue, { action }) => {
    if (action === "input-change") {
      setSearch(inputValue);
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => {
        setPage(1);
        loadOptions(1, inputValue, true);
      }, 300);
    }
  };

  const selectedOption = useMemo(() => {
    if (!value) return null;
    return options.find(opt => opt.value === value) || { value, label: value };
  }, [value, options]);

  return (
    <Select
      key={theme}
      {...getReactSelectMenuProps()}
      styles={mergedStyles}
      options={options}
      value={selectedOption}
      onChange={(selected) => onChange(selected ? selected.value : null, selected)}
      onInputChange={handleInputChange}
      onMenuScrollToBottom={handleMenuScrollToBottom}
      isLoading={loading}
      placeholder={placeholder}
      isClearable
      formatOptionLabel={formatOptionLabel}
      filterOption={() => true}
      {...props}
    />
  );
};

export default AsyncSelectField;
