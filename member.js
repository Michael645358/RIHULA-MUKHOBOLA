/* RIHULA M-PESA STK PUSH
   Starts payment, then polls the server-side status function for Safaricom confirmation.
   The status endpoint must verify the transaction with the trusted backend.
*/
window.requestRihulaMpesaPayment = async function () {
  const supabase = window.db || window.supabaseClient;
  const statusEl = document.getElementById("mpesaPaymentStatus");
  const payButton = document.getElementById("mpesaPayButton");
  const phoneEl = document.getElementById("mpesaPhone");
  const amountEl = document.getElementById("mpesaAmount");

  const showStatus = (message, kind = "info") => {
    if (!statusEl) { alert(message); return; }
    statusEl.replaceChildren();
    statusEl.dataset.state = kind;
    statusEl.style.color = kind === "error" ? "#b42318" :
      kind === "success" ? "#087f3e" : "#246b50";
    statusEl.textContent = message;
  };
  const showReceipt = (amount, receipt) => {
    if (!statusEl) return;
    statusEl.innerHTML = `
      <section role="dialog" aria-live="polite" style="margin-top:14px;padding:18px;border:1px solid #b7e4c7;border-radius:14px;background:#f0fff4;color:#14532d;text-align:left">
        <div style="font-size:30px;text-align:center">✓</div>
        <h3 style="margin:6px 0;text-align:center">Contribution recorded successfully!</h3>
        <h2 style="margin:8px 0;text-align:center">KSh ${Number(amount).toLocaleString("en-KE")}</h2>
        <p style="text-align:center">Your contribution has been received and recorded.</p>
        <hr style="border:0;border-top:1px solid #b7e4c7">
        <p><strong>Payment status:</strong> Successful</p>
        <p><strong>M-Pesa receipt:</strong> ${String(receipt || "Confirmed").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}</p>
      </section>`;
    statusEl.dataset.state = "success";
    if (typeof window.showPopup === "function") window.showPopup("Contribution recorded successfully!", "success");
  };
  const refreshMemberData = async () => {
    // Refresh the visible history/savings using whichever functions this version exposes.
    for (const fn of ["loadContributionHistory", "loadSavingsStats", "loadMemberData"]) {
      if (typeof window[fn] === "function") {
        try { await window[fn](); } catch (e) { console.warn("Could not refresh " + fn, e); }
      }
    }
  };

  if (!supabase?.auth || !supabase?.functions) {
    showStatus("RIHULA connection is not ready. Refresh the page and sign in again.", "error"); return;
  }
  const phone = String(phoneEl?.value || "").trim().replace(/[\s-]/g, "");
  const amount = Number(String(amountEl?.value || "").trim());
  if (!/^(?:254|0)?[17]\d{8}$/.test(phone)) {
    showStatus("Enter a valid Kenyan Safaricom number, for example 0712345678.", "error"); phoneEl?.focus(); return;
  }
  if (!Number.isInteger(amount) || amount < 1 || amount > 250000) {
    showStatus("Enter a whole-number contribution from KSh 1 to KSh 250,000.", "error"); amountEl?.focus(); return;
  }

  let originalText = payButton?.textContent || "Pay with M-Pesa";
  try {
    if (payButton) { payButton.disabled = true; payButton.textContent = "Sending STK prompt…"; }
    showStatus("Checking your RIHULA sign-in…");
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session?.access_token) {
      showStatus("Your session has expired. Please sign in again before making a contribution.", "error"); return;
    }
    showStatus("Sending payment request to Safaricom…");
    const { data, error } = await supabase.functions.invoke("rehula-mpesa", { body: { phone, amount } });
    if (error || !data?.success) {
      console.error("RIHULA M-PESA request error:", error || data);
      showStatus(data?.error || "RIHULA could not start the STK request. Check your connection and try again. If a prompt arrived, check your M-Pesa messages before retrying.", "error");
      return;
    }

    const checkoutRequestId = data.CheckoutRequestID || data.checkoutRequestID ||
      data.checkoutRequestId || data.checkout_request_id || data.data?.CheckoutRequestID;
    const merchantRequestId = data.MerchantRequestID || data.merchantRequestID ||
      data.merchantRequestId || data.merchant_request_id || data.data?.MerchantRequestID;
    if (!checkoutRequestId) {
      showStatus("M-Pesa prompt requested. Complete the prompt on your phone. RIHULA needs a CheckoutRequestID from its payment function to check the final result automatically.", "info");
      return;
    }

    const startedAt = Date.now();
    const maxWaitMs = 180000;
    let pollErrors = 0;
    showStatus("M-Pesa prompt sent. Complete payment on your phone. Checking payment status…", "info");

    while (Date.now() - startedAt < maxWaitMs) {
      await new Promise(resolve => setTimeout(resolve, 2500));
      let result;
      try {
        const response = await supabase.functions.invoke("rehula-mpesa-status", {
          body: { checkoutRequestId, CheckoutRequestID: checkoutRequestId, merchantRequestId, amount, phone }
        });
        if (response.error) throw response.error;
        result = response.data || {};
        pollErrors = 0;
      } catch (pollError) {
        // A temporary network/function error must not end payment confirmation.
        pollErrors += 1;
        console.warn("RIHULA payment-status polling failed (attempt " + pollErrors + "):", pollError);
        if (pollErrors === 1 || pollErrors % 5 === 0) {
          showStatus("Your payment request is active. Reconnecting to Safaricom confirmation…", "info");
        }
        continue;
      }

      // Support both the direct Edge Function response and a wrapped response.
      if (result.data && typeof result.data === "object") result = result.data;
      const status = String(result.status || result.paymentStatus || result.Result || result.result || "").toLowerCase();
      const receipt = result.mpesaReceiptNumber || result.MpesaReceiptNumber ||
        result.receiptNumber || result.receipt || result.mpesa_receipt;

      if (result.success === true && (receipt || result.final === true ||
          ["success", "successful", "completed", "paid"].includes(status))) {
        showReceipt(amount, receipt);
        await refreshMemberData();
        return;
      }

      if (["failed", "failure", "cancelled", "canceled", "timeout", "timed out", "rejected"].includes(status) ||
          (result.success === false && result.final === true)) {
        showStatus(result.message || result.error || "M-Pesa payment was not completed. No successful contribution was confirmed. You can try again.", "error");
        return;
      }
    }

    showStatus("Your payment is taking longer than usual to confirm. Do not pay again yet. Check your M-Pesa message; RIHULA will need to confirm the transaction before showing it as successful.", "info");
  } catch (error) {
    console.error("RIHULA payment error:", error);
    showStatus("A connection error occurred. Check your M-Pesa messages before trying again.", "error");
  } finally {
    if (payButton) { payButton.disabled = false; payButton.textContent = originalText; }
  }
};
