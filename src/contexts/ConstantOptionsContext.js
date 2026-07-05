import { createContext, useContext, useEffect, useMemo, useState } from "react";
import apiCall from "../utils/apiCall";
import { useAuth } from "./AuthContext";

const ConstantOptionsContext = createContext();

const CONSTANTS_CACHE_KEY = "admin_constants_cache_v1";

const EMPTY_CONSTANTS = {
  ALLOWED_DISCOUNT_TYPES: [],
  ALLOWED_STATUS: [],
  PAYMENT_STATUS: [],
  PAYMENT_GATEWAYS: [],
  USER_TYPES: [],
  GENDERS: [],
  ALLOWED_SERVICE_TYPES: [],
};

let constantsMemoryCache = null;
let constantsRequest = null;
let hasFetchedConstantsThisSession = false;

const readCachedConstants = () => {
  if (constantsMemoryCache) return constantsMemoryCache;

  try {
    const cached = localStorage.getItem(CONSTANTS_CACHE_KEY);

    if (!cached) return null;

    const parsed = JSON.parse(cached);
    constantsMemoryCache = parsed;

    return parsed;
  } catch {
    localStorage.removeItem(CONSTANTS_CACHE_KEY);
    return null;
  }
};

const writeCachedConstants = (constants) => {
  constantsMemoryCache = constants;
  localStorage.setItem(CONSTANTS_CACHE_KEY, JSON.stringify(constants));
};

const labelFromValue = (value) =>
  String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const toOptions = (values = []) =>
  values.map((value) => ({
    value,
    label: labelFromValue(value),
  }));

const fetchConstantsOnce = async () => {
  if (!constantsRequest) {
    constantsRequest = apiCall("/api/admin/constants")
      .then((response) => response.json())
      .then((json) => {
        if (!json?.success || !json?.data) {
          throw new Error("Failed to load constants");
        }

        writeCachedConstants(json.data);
        return json.data;
      })
      .finally(() => {
        constantsRequest = null;
      });
  }

  return constantsRequest;
};

export const ConstantOptions = () => {
  const context = useContext(ConstantOptionsContext);

  if (!context) {
    throw new Error(
      "ConstantOptions must be used within ServiceOptionsProvider"
    );
  }

  return context;
};

export const ServiceOptionsProvider = ({ children }) => {
  const { user } = useAuth();
  const cachedConstants = readCachedConstants();

  const [constants, setConstants] = useState(
    cachedConstants || EMPTY_CONSTANTS
  );

  const [loadingConstants, setLoadingConstants] = useState(
    !cachedConstants
  );

  useEffect(() => {
    // Don't fetch constants if no user is logged in
    if (!user?.token) {
      setLoadingConstants(false);
      hasFetchedConstantsThisSession = false;
      return;
    }

    if (hasFetchedConstantsThisSession) {
      setLoadingConstants(false);
      return;
    }

    // Delay 500ms so StrictMode's cleanup clears the first timer before it fires
    // — ensuring only 1 API call is made.
    const timer = setTimeout(() => {
      fetchConstantsOnce()
        .then((data) => {
          setConstants(data);
          hasFetchedConstantsThisSession = true;
        })
        .catch((error) => {
          console.error("Failed to load constants:", error);
        })
        .finally(() => {
          setLoadingConstants(false);
        });
    }, 500);

    return () => clearTimeout(timer);
  }, [user?.token]);

  const value = useMemo(
    () => ({
      constants,
      loadingConstants,

      serviceTypeOptions: toOptions(
        constants.ALLOWED_SERVICE_TYPES
      ),

      discountTypeOptions: toOptions(
        constants.ALLOWED_DISCOUNT_TYPES
      ),

      orderStatusOptions: toOptions(
        constants.ALLOWED_STATUS
      ),

      paymentStatusOptions: toOptions(
        constants.PAYMENT_STATUS
      ),

      paymentGatewayOptions: toOptions(
        constants.PAYMENT_GATEWAYS
      ),

      userTypeOptions: toOptions(
        constants.USER_TYPES
      ),

      genderOptions: toOptions(
        constants.GENDERS
      ),
    }),
    [constants, loadingConstants]
  );

  return (
    <ConstantOptionsContext.Provider value={value}>
      {children}
    </ConstantOptionsContext.Provider>
  );
};