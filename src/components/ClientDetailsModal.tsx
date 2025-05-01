@@ .. @@
   const [hasRecentGFE, setHasRecentGFE] = React.useState(false);
 
-  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
+  const FORTY_FIVE_DAYS_MS = 45 * 24 * 60 * 60 * 1000; // 45 days in milliseconds
  const FORTY_FIVE_DAYS_MS = 45 * 24 * 60 * 60 * 1000; // 45 days in milliseconds
  const FORTY_FIVE_DAYS_MS = 45 * 24 * 60 * 60 * 1000; // 45 days in milliseconds

  React.useEffect(() => {
    if (gfes.length > 0) {
-      const thirtyDaysAgo = Date.now() - THIRTY_DAYS_MS;
+      const fortyFiveDaysAgo = Date.now() - FORTY_FIVE_DAYS_MS;
      const fortyFiveDaysAgo = Date.now() - FORTY_FIVE_DAYS_MS;
      const recentGFE = gfes.some(gfe => {
        const gfeDate = new Date(gfe.completedAt || gfe.startedAt || '').getTime();
-        return !isNaN(gfeDate) && gfeDate > thirtyDaysAgo;
+        return !isNaN(gfeDate) && gfeDate > fortyFiveDaysAgo;
      });
      setHasRecentGFE(recentGFE);
    } else {
      setHasRecentGFE(false);
    }
  }, [gfes]);
 .. @@
              {!hasRecentGFE && gfes.length > 0 && (
                <div className="flex items-center gap-2 p-4 mb-4 bg-yellow-50 text-yellow-700 rounded-lg">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
-                  <span>No GFEs completed in the last 30 days</span>
+                  <span>No GFEs completed in the last 45 days</span>
                </div>
              )}