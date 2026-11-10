/**
 * Darwin's address never appears as text in the page, the scripts or the repo:
 * it is stored reversed and in base64 (`data-mail`), and decoded only when a
 * visitor acts (a click, a submit). Address harvesters read text and common
 * tricks like "name [at] domain" or split attributes; this one they skip.
 *
 * To encode a new address:
 *   python3 -c "import base64;print(base64.b64encode('ADDRESS'[::-1].encode()).decode())"
 */
export const decodeMail = (code) => {
    if (!code)
        return null;
    try {
        const address = [...atob(code)].reverse().join("");
        return address.includes("@") ? address : null;
    }
    catch {
        return null;
    }
};
