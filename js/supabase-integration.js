
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const config = window.ANA_SUPABASE_CONFIG;

if (!config?.url || !config?.key) {
  throw new Error("Configure a URL e a publishable key em js/supabase-config.js.");
}

const supabase = createClient(config.url, config.key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

window.anaSupabase = supabase;

const $ = (selector, root = document) => root.querySelector(selector);

const localSessionKey = "aa_session";

const escapeHTML = (value = "") =>
  String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));

const feedback = (selector, message) => {
  const element = $(selector);
  if (element) element.textContent = message;
};

const isAdminLoginMode = () =>
  new URLSearchParams(location.search).get("admin") === "1";

function cacheSession(user, profile) {
  const value = {
    id: user.id,
    name: profile?.name || user.user_metadata?.name || user.email || "Cliente",
    email: user.email || "",
    phone: profile?.phone || user.user_metadata?.phone || "",
    role: profile?.role || "client"
  };

  localStorage.setItem(localSessionKey, JSON.stringify(value));
  return value;
}

async function getProfile(user) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,name,phone,role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

function showAccountState(session) {
  const accountArea = $("#account-area");
  const profileArea = $("#profile-area");

  if (!accountArea || !profileArea) return;

  accountArea.hidden = !!session;
  profileArea.hidden = !session;

  if (!session) return;

  const nameHeading = $("#profile-name");
  if (nameHeading) {
    nameHeading.textContent = session.name || session.email || "Cliente";
  }

  const form = $("#client-profile-form");

  if (form) {
    if (form.elements.name) form.elements.name.value = session.name || "";
    if (form.elements.phone) form.elements.phone.value = session.phone || "";
    if (form.elements.email) form.elements.email.value = session.email || "";
  }
}

function setupAccountSwitcher() {
  const login = $("#login-form");
  const register = $("#register-form");
  const button = $("#account-switch-button");
  const copy = $("#account-switch-copy");

  if (!login || !register || !button) return;

  if (isAdminLoginMode()) {
    const switchArea = $("#account-area .account-switch");
    if (switchArea) switchArea.hidden = true;

    login.hidden = false;
    register.hidden = true;

    const heading = $(".page-heading h1");
    const description = $(".page-heading p");

    if (heading) heading.textContent = "Acesso administrativo";
    if (description) {
      description.textContent = "Entre com a conta administrativa da Ana.";
    }

    return;
  }

  let mode = "login";

  const render = () => {
    login.hidden = mode !== "login";
    register.hidden = mode !== "register";

    if (copy) {
      copy.textContent = mode === "login"
        ? "Ainda não tem cadastro?"
        : "Já possui uma conta?";
    }

    button.textContent = mode === "login"
      ? "Criar minha conta"
      : "Voltar para entrar";
  };

  button.addEventListener("click", () => {
    mode = mode === "login" ? "register" : "login";
    render();
  });

  render();
}

async function protectAdminPage() {
  const shell = $(".admin-shell");
  const header = $(".admin-header");
  const authMessage = $("#admin-auth-message");

  if (!shell || !header) return;

  shell.hidden = true;
  header.hidden = true;

  if (authMessage) {
    authMessage.hidden = false;
    authMessage.textContent = "Verificando acesso administrativo...";
  }

  const redirectToAdminLogin = () => {
    location.replace("perfil.html?admin=1");
  };

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirectToAdminLogin();
    return;
  }

  let profile;

  try {
    profile = await getProfile(user);
  } catch (err) {
    console.error("Erro ao validar perfil administrativo:", err);
    alert("Não foi possível validar seu acesso: " + err.message);
    redirectToAdminLogin();
    return;
  }

  if (profile?.role !== "admin") {
    await supabase.auth.signOut();
    localStorage.removeItem(localSessionKey);
    redirectToAdminLogin();
    return;
  }

  const session = cacheSession(user, profile);

  const welcome = $(".admin-welcome strong");
  if (welcome) welcome.textContent = `Olá, ${session.name}`;

  header.hidden = false;
  shell.hidden = false;

  if (authMessage) authMessage.hidden = true;

  $("#admin-logout")?.addEventListener("click", async () => {
    const { error: signOutError } = await supabase.auth.signOut();

    localStorage.removeItem(localSessionKey);

    if (signOutError) {
      alert("Não foi possível encerrar a sessão: " + signOutError.message);
    }

    location.replace("perfil.html?admin=1");
  });

  await loadOnlineBookings();

  supabase.channel("admin-online-appointments")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "appointments"
      },
      loadOnlineBookings
    )
    .subscribe();
}

async function loadOnlineBookings() {
  const host = $("#online-booking-list");
  if (!host) return;

  const { data: rows, error } = await supabase
    .from("appointments")
    .select("id,client_id,client_name,client_email,phone,procedure,appointment_date,appointment_time,notes,status,admin_note")
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true });

  if (error) {
    host.innerHTML = `<p class="muted">Erro ao carregar solicitações: ${escapeHTML(error.message)}</p>`;
    return;
  }

  if (!rows?.length) {
    host.innerHTML = '<p class="muted">Nenhuma solicitação online recebida ainda.</p>';
    return;
  }

  host.innerHTML = rows.map(item => `
    <article class="admin-item booking-admin-item">
      <div>
        <strong>
          ${escapeHTML(item.client_name || "Cliente")} ·
          ${escapeHTML(item.procedure || "Procedimento")}
        </strong>

        <small>
          ${escapeHTML(item.appointment_date || "Data não informada")}
          às ${escapeHTML(String(item.appointment_time || "").slice(0, 5))}
          · ${escapeHTML(item.phone || "Sem telefone")}
        </small>

        <small>
          ${escapeHTML(item.client_email || "")}
          · ${escapeHTML(item.notes || "Sem observações")}
        </small>

        <label class="booking-status-label">
          Status
          <select data-online-status="${escapeHTML(item.id)}">
            ${["Solicitado", "Disponível", "Ocupada", "Confirmado", "Cancelado"]
              .map(status => `
                <option ${item.status === status ? "selected" : ""}>
                  ${status}
                </option>
              `).join("")}
          </select>
        </label>

        <label class="booking-status-label">
          Observação para a cliente
          <textarea data-online-note="${escapeHTML(item.id)}" rows="2">${escapeHTML(item.admin_note || "")}</textarea>
        </label>

        <button type="button" class="mini-btn" data-online-save="${escapeHTML(item.id)}">
          Salvar atualização
        </button>
      </div>
    </article>
  `).join("");

  host.querySelectorAll("[data-online-save]").forEach(button => {
    button.addEventListener("click", async () => {
      const id = button.dataset.onlineSave;

      const status = host.querySelector(
        `[data-online-status="${CSS.escape(id)}"]`
      )?.value;

      const admin_note = host.querySelector(
        `[data-online-note="${CSS.escape(id)}"]`
      )?.value || "";

      button.disabled = true;

      const { error: updateError } = await supabase
        .from("appointments")
        .update({ status, admin_note })
        .eq("id", id);

      button.disabled = false;

      if (updateError) {
        alert("Não foi possível atualizar: " + updateError.message);
      } else {
        alert("Atualização salva e disponível para a cliente.");
      }
    });
  });
}

async function setupRegistration() {
  const form = $("#register-form");
  if (!form) return;

  form.addEventListener("submit", async event => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const values = Object.fromEntries(new FormData(form));

    const submit = form.querySelector(
      'button[type="submit"], button:not([type])'
    );

    if (submit) submit.disabled = true;

    try {
      const { data, error } = await supabase.auth.signUp({
        email: String(values.email || "").trim().toLowerCase(),
        password: values.password,
        options: {
          data: {
            name: values.name,
            phone: values.phone
          }
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error("O Supabase não retornou o usuário criado.");

      if (!data.session) {
        alert("Cadastro criado. Confirme o e-mail e depois entre na sua conta.");
        form.reset();
        return;
      }

      let profile = await getProfile(data.user).catch(() => null);

      if (!profile) {
        const { data: inserted, error: insertError } = await supabase
          .from("profiles")
          .upsert({
            id: data.user.id,
            name: values.name,
            phone: values.phone,
            role: "client"
          })
          .select("id,name,phone,role")
          .single();

        if (insertError) throw insertError;
        profile = inserted;
      }

      cacheSession(data.user, profile);
      location.assign("perfil.html?cadastro=sucesso");

    } catch (err) {
      alert("Não foi possível criar a conta: " + err.message);
    } finally {
      if (submit) submit.disabled = false;
    }
  }, true);
}

async function setupLogin() {
  const form = $("#login-form");
  if (!form) return;

  form.addEventListener("submit", async event => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const values = Object.fromEntries(new FormData(form));
    const email = String(values.email || "").trim().toLowerCase();
    const password = values.password;

    if (!email || !password) {
      alert("Preencha o e-mail e a senha.");
      return;
    }

    const submit = form.querySelector(
      'button[type="submit"], button:not([type])'
    );

    if (submit) submit.disabled = true;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      if (!data.user) throw new Error("O Supabase não retornou um usuário autenticado.");

      let profile = await getProfile(data.user);

      if (!profile) {
        const { data: created, error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: data.user.id,
            name: data.user.user_metadata?.name || email,
            phone: data.user.user_metadata?.phone || "",
            role: "client"
          })
          .select("id,name,phone,role")
          .single();

        if (profileError) throw profileError;
        profile = created;
      }

      if (isAdminLoginMode() && profile?.role !== "admin") {
        await supabase.auth.signOut();
        localStorage.removeItem(localSessionKey);

        throw new Error(
          "Esta conta não possui permissão administrativa. Entre com a conta da Ana."
        );
      }

      cacheSession(data.user, profile);

      if (profile.role === "admin") {
        location.assign("admin.html");
      } else {
        location.assign("perfil.html");
      }

    } catch (err) {
      alert("Não foi possível entrar: " + err.message);
    } finally {
      if (submit) submit.disabled = false;
    }
  }, true);
}

async function setupProfilePage() {
  if (!$("#account-area")) return;

  if (isAdminLoginMode()) {
    showAccountState(null);
    return;
  }

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error) {
    feedback("#profile-feedback", "Não foi possível verificar sua sessão: " + error.message);
    return;
  }

  if (!user) {
    localStorage.removeItem(localSessionKey);
    showAccountState(null);
    return;
  }

  try {
    let profile = await getProfile(user);

    if (!profile) {
      profile = {
        id: user.id,
        name: user.user_metadata?.name || user.email,
        phone: user.user_metadata?.phone || "",
        role: "client"
      };
    }

    const session = cacheSession(user, profile);
    showAccountState(session);

    if (new URLSearchParams(location.search).get("cadastro") === "sucesso") {
      feedback("#profile-feedback", "Conta criada com sucesso! Você já está conectado.");
      history.replaceState({}, document.title, location.pathname);
    }

    const { data: bookings, error: bookingError } = await supabase
      .from("appointments")
      .select("id,procedure,appointment_date,appointment_time,status,admin_note")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });

    const target = $("#my-bookings");

    if (target) {
      if (bookingError) {
        target.innerHTML = `
          <p class="muted">
            Não foi possível carregar seus agendamentos:
            ${escapeHTML(bookingError.message)}
          </p>
        `;
      } else {
        target.innerHTML = (bookings || []).map(item => `
          <div class="profile-booking">
            <strong>${escapeHTML(item.procedure)}</strong>
            · ${escapeHTML(item.appointment_date)}
            às ${escapeHTML(String(item.appointment_time || "").slice(0, 5))}
            <br>
            <span>Status: ${escapeHTML(item.status || "Solicitado")}</span>
            ${item.admin_note
              ? `<br><small>Mensagem da Ana: ${escapeHTML(item.admin_note)}</small>`
              : ""}
          </div>
        `).join("") || `
          <p class="muted">
            Seus agendamentos aparecerão aqui quando houver solicitações.
          </p>
        `;
      }
    }

  } catch (err) {
    feedback("#profile-feedback", "Erro ao carregar seu perfil: " + err.message);
  }

  $("#client-profile-form")?.addEventListener("submit", async event => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const form = event.currentTarget;
    const name = form.elements.name.value.trim();
    const phone = form.elements.phone.value.trim();

    if (!name) {
      feedback("#profile-feedback", "Informe seu nome para continuar.");
      return;
    }

    const { data: { user: activeUser } } = await supabase.auth.getUser();

    if (!activeUser) {
      feedback("#profile-feedback", "Sua sessão expirou. Entre novamente.");
      return;
    }

    const { data, error: updateError } = await supabase
      .from("profiles")
      .upsert({
        id: activeUser.id,
        name,
        phone
      })
      .select("id,name,phone,role")
      .single();

    if (updateError) {
      feedback("#profile-feedback", "Não foi possível salvar: " + updateError.message);
      return;
    }

    const session = cacheSession(activeUser, data);
    showAccountState(session);

    feedback("#profile-feedback", "Perfil salvo no banco de dados com sucesso!");
  }, true);

  $("#logout-account")?.addEventListener("click", async () => {
    const { error: signOutError } = await supabase.auth.signOut();
    localStorage.removeItem(localSessionKey);

    if (signOutError) {
      alert("Não foi possível encerrar a sessão: " + signOutError.message);
    }

    location.replace("index.html");
  }, { once: true });
}

async function setupPublicBooking() {
  const form = $("#public-booking-form");
  if (!form) return;

  const procedureSelect = $("#public-booking-procedure");

  if (procedureSelect && !procedureSelect.options.length) {
    const availableProcedures =
      typeof window.procedures === "function"
        ? window.procedures()
        : [];

    procedureSelect.innerHTML = availableProcedures.map(item => `
      <option value="${escapeHTML(item.name)}">
        ${escapeHTML(item.name)}
      </option>
    `).join("");
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const profile = await getProfile(user).catch(() => null);

    if (form.elements.client) {
      form.elements.client.value = profile?.name || user.user_metadata?.name || "";
      form.elements.client.readOnly = true;
    }

    if (form.elements.email) {
      form.elements.email.value = user.email || "";
    }

    if (form.elements.phone && profile?.phone) {
      form.elements.phone.value = profile.phone;
    }
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const { data: { user: activeUser } } = await supabase.auth.getUser();

    if (!activeUser) {
      feedback("#booking-feedback", "Entre ou crie sua conta antes de solicitar um horário.");
      location.assign("perfil.html");
      return;
    }

    const values = Object.fromEntries(new FormData(form));
    const profile = await getProfile(activeUser).catch(() => null);

    const payload = {
      client_id: activeUser.id,
      client_name: values.client || profile?.name || activeUser.user_metadata?.name || "Cliente",
      client_email: activeUser.email,
      phone: values.phone || profile?.phone || "",
      procedure: values.procedure,
      appointment_date: values.date,
      appointment_time: values.time,
      notes: values.notes || "",
      status: "Solicitado"
    };

    const { error: insertError } = await supabase
      .from("appointments")
      .insert(payload);

    if (insertError) {
      feedback("#booking-feedback", "Não foi possível enviar: " + insertError.message);
      return;
    }

    feedback("#booking-feedback", "Solicitação enviada! A Ana poderá visualizar no painel administrativo.");

    form.reset();

    if (form.elements.client) {
      form.elements.client.value = payload.client_name;
      form.elements.client.readOnly = true;
    }

    if (form.elements.email) {
      form.elements.email.value = activeUser.email || "";
    }
  }, true);
}

async function start() {
  setupAccountSwitcher();

  await setupRegistration();
  await setupLogin();

  if (location.pathname.endsWith("admin.html")) {
    await protectAdminPage();
  } else {
    await setupProfilePage();
    await setupPublicBooking();
  }
}

start().catch(error => {
  console.error("Falha na integração Supabase:", error);

  feedback("#profile-feedback", "Falha na integração Supabase: " + error.message);

  const adminShell = $(".admin-shell");
  if (adminShell) adminShell.hidden = true;

  const adminMessage = $("#admin-auth-message");

  if (adminMessage) {
    adminMessage.hidden = false;
    adminMessage.textContent = "Não foi possível iniciar a integração: " + error.message;
  }
});
