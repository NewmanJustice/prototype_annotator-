Plan: SPA URL Change Detection for prototype-annotator                                                                                                                                                        
                                                                                                                                                                                                               
 Problem                                                                                                                                                                                                       
                                                                                                                                                                                                               
 The prototype-annotator overlay fetches annotations once on mount using window.location.pathname. In SPAs (React, Vue, etc.), client-side routing changes the URL without page reloads, so the overlay        
 doesn't detect route changes and annotations don't update.                                                                                                                                                    

 Solution

 Add URL change detection to the overlay client code to automatically refresh annotations when the URL changes.

 ---
 Implementation

 File to Modify

 client/src/hooks/useAnnotations.ts (in prototype-annotator repo)

 This is the primary hook that manages annotation state and fetching. The currentUrl is determined once at initialization.

 Changes Required

 1. Track URL as state (not const)

 // Before
 const currentUrl = window.location.origin + window.location.pathname;

 // After
 const [currentUrl, setCurrentUrl] = useState(
   () => window.location.origin + window.location.pathname
 );

 2. Add URL change detection effect

 Add a new useEffect that detects URL changes via multiple mechanisms:

 useEffect(() => {
   let lastUrl = window.location.href;

   // Handle browser back/forward
   const handlePopState = () => {
     const newUrl = window.location.origin + window.location.pathname;
     if (newUrl !== currentUrl) {
       setCurrentUrl(newUrl);
     }
   };

   // Handle hash changes
   const handleHashChange = () => {
     const newUrl = window.location.origin + window.location.pathname;
     if (newUrl !== currentUrl) {
       setCurrentUrl(newUrl);
     }
   };

   // Poll for pushState/replaceState changes (SPA routers)
   // This catches React Router, Vue Router, etc.
   const intervalId = setInterval(() => {
     if (window.location.href !== lastUrl) {
       lastUrl = window.location.href;
       const newUrl = window.location.origin + window.location.pathname;
       if (newUrl !== currentUrl) {
         setCurrentUrl(newUrl);
       }
     }
   }, 200); // Check every 200ms

   window.addEventListener('popstate', handlePopState);
   window.addEventListener('hashchange', handleHashChange);

   return () => {
     window.removeEventListener('popstate', handlePopState);
     window.removeEventListener('hashchange', handleHashChange);
     clearInterval(intervalId);
   };
 }, [currentUrl]);

 3. Trigger refresh when URL changes

 The existing useEffect for refresh should already trigger when currentUrl changes (it's in the dependency array). Verify this is the case:

 useEffect(() => {
   refresh();
 }, [refresh]); // refresh depends on currentUrl, so this triggers on URL change

 ---
 Optional Enhancements

 Clear selection state on navigation

 In Overlay.tsx or useSelection.ts, reset selection when URL changes:

 // In Overlay.tsx, pass currentUrl to child components
 // When URL changes, clear any active selection mode
 useEffect(() => {
   setSelectionMode(null);
   setSelectedElement(null);
 }, [currentUrl]);

 Expose manual refresh API

 Add a global refresh function for edge cases:

 // In useAnnotations or Overlay initialization
 useEffect(() => {
   window.__PROTOTYPE_ANNOTATOR__ = {
     refresh: () => {
       const newUrl = window.location.origin + window.location.pathname;
       setCurrentUrl(newUrl);
     }
   };
 }, []);

 ---
 Verification

 1. Build the updated package: npm run build
 2. Update version in package.json (e.g., 0.2.4)
 3. Publish or link locally
 4. Test in adoption_test app:
   - Navigate between routes (e.g., / → /login → /dashboard)
   - Verify annotations refresh on each navigation
   - Add annotation on one page, navigate away, navigate back - should persist
   - Use browser back/forward buttons - should refresh

 ---
 Summary
 ┌───────────────────────┬───────────────────┬─────────────────────────────────────────────────┐
 │        Change         │       File        │                   Description                   │
 ├───────────────────────┼───────────────────┼─────────────────────────────────────────────────┤
 │ Track URL as state    │ useAnnotations.ts │ Change const to useState                        │
 ├───────────────────────┼───────────────────┼─────────────────────────────────────────────────┤
 │ Add URL detection     │ useAnnotations.ts │ Add useEffect with popstate + polling           │
 ├───────────────────────┼───────────────────┼─────────────────────────────────────────────────┤
 │ Clear selection       │ Overlay.tsx       │ Reset selection mode on URL change              │
 ├───────────────────────┼───────────────────┼─────────────────────────────────────────────────┤
 │ (Optional) Global API │ Overlay.tsx       │ Expose window.__PROTOTYPE_ANNOTATOR__.refresh() │
 └───────────────────────┴───────────────────┴─────────────────────────────────────────────────┘