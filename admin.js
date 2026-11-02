(() => {
  "use strict";
  const S=window.WHAMSY_STORE, q=selector=>document.querySelector(selector);
  const login=q("[data-admin-login]"), dashboard=q("[data-admin-dashboard]"), form=q("[data-product-form]"), editor=q("[data-product-editor]");
  let items=[];
  const element=(tag,value="",cls="")=>{const n=document.createElement(tag);n.textContent=value;if(cls)n.className=cls;return n};
  function setStatus(selector,message,error=false){const n=q(selector);if(n){n.textContent=message;n.classList.toggle("status-error",error)}}
  function showDashboard(user){login.hidden=true;dashboard.hidden=false;q("[data-sign-out]").hidden=S.demoMode; q("[data-admin-greeting]").textContent=user?"Signed in as "+user.email:"Manage the preview catalogue on this device.";refreshList()}
  function showLogin(){dashboard.hidden=true;login.hidden=false;q("[data-supabase-needed]").hidden=false}
  function slugify(value){return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||("pillow-"+Date.now())}
  function displayPrice(p){return p.show_price&&p.price_ksh!==null?S.money(p.price_ksh):"Price hidden · WhatsApp"}
  async function refreshList(){
    const root=q("[data-admin-products]");root.replaceChildren(element("p","Loading products…","form-intro"));
    try{items=await S.loadProducts(true);q("[data-product-count]").textContent=items.length+" products in your catalogue";root.replaceChildren();
      if(!items.length){root.append(element("p","No products yet. Add your first pillow when you’re ready."));return}
      items.forEach(p=>{const row=element("article","","admin-product-row"),img=document.createElement("img");img.src=p.image_url;img.alt="";img.onerror=()=>{img.onerror=null;img.src="assets/collection-dreams.jpg"};const info=element("div","","admin-product-info");info.append(element("span",S.categories[p.category]||p.category,"product-category"),element("h3",p.name),element("p",displayPrice(p)+" · "+(p.is_active?"Published":"Draft"),"admin-product-meta"));const actions=element("div","","admin-row-actions");const edit=element("button","Edit","button-secondary");edit.type="button";edit.dataset.editProduct=p.id;const toggle=element("button",p.is_active?"Unpublish":"Publish","button-secondary");toggle.type="button";toggle.dataset.toggleProduct=p.id;const remove=element("button","Remove","remove-item");remove.type="button";remove.dataset.deleteProduct=p.id;actions.append(edit,toggle,remove);row.append(img,info,actions);root.append(row)});
    }catch(error){root.replaceChildren(element("p","Could not load products: "+error.message,"form-status status-error"))}
  }
  function setField(name,value){const field=form.elements.namedItem(name);if(field)field.type==="checkbox"?field.checked=!!value:field.value=value??""}
  function editProduct(p){form.reset();setField("id",p?.id||"");setField("slug",p?.slug||"");setField("name",p?.name||"");setField("category",p?.category||"REST");setField("price_ksh",p?.price_ksh??"");setField("availability",p?.availability||"in_stock");setField("description",p?.description||"");setField("materials",p?.materials||"");setField("dimensions",p?.dimensions||"");setField("care_instructions",p?.care_instructions||"");setField("sort_order",p?.sort_order??100);setField("image_url",p?.image_url||"");setField("image_path",p?.image_path||"");setField("show_price",p?p.show_price:true);setField("is_active",p?p.is_active:false);setField("is_featured",p? p.is_featured:false);form.elements.namedItem("image_file").value="";q("[data-editor-title]").textContent=p?"Edit product":"Add a pillow";setStatus("[data-product-status]","");const preview=q("[data-image-preview]"),empty=q("[data-image-empty]");preview.src=p?.image_url||"";preview.hidden=!p?.image_url;empty.hidden=!!p?.image_url;editor.hidden=false;editor.scrollIntoView({behavior:"smooth",block:"start"})}
  function cancelEditor(){editor.hidden=true;form.reset()}
  async function save(event){event.preventDefault();const button=q("[data-save-product]");button.disabled=true;setStatus("[data-product-status]","Saving product…");
    try{
      const fd=new FormData(form), id=String(fd.get("id")||"");let imageUrl=String(fd.get("image_url")||"").trim(), imagePath=String(fd.get("image_path")||"")||null;const file=form.elements.namedItem("image_file").files[0];
      if(file){const uploaded=await S.uploadImage(file);imageUrl=uploaded.image_url;imagePath=uploaded.image_path}
      if(!imageUrl)throw new Error("Add a product image URL or upload an image after connecting the online store.");
      const name=String(fd.get("name")||"").trim(), previous=items.find(p=>p.id===id);const product={id:id||undefined,slug:String(fd.get("slug")||"")||slugify(name),name,category:fd.get("category"),description:String(fd.get("description")||"").trim(),price_ksh:fd.get("price_ksh")===""?null:Number(fd.get("price_ksh")),show_price:form.elements.namedItem("show_price").checked,image_url:imageUrl,image_path:imagePath,materials:String(fd.get("materials")||"").trim(),dimensions:String(fd.get("dimensions")||"").trim(),care_instructions:String(fd.get("care_instructions")||"").trim(),availability:fd.get("availability"),is_active:form.elements.namedItem("is_active").checked,is_featured:form.elements.namedItem("is_featured").checked,sort_order:Number(fd.get("sort_order")||100)};
      await S.saveProduct(product);if(previous?.image_path&&previous.image_path!==imagePath)await S.deleteImage(previous.image_path).catch(()=>{});setStatus("[data-product-status]",S.demoMode?"Saved on this device only. Connect the online store to share changes with customers.":"Product saved and shared with the shop.");await refreshList();setTimeout(()=>{editor.hidden=true},900);
    }catch(error){setStatus("[data-product-status]",error.message,true)}finally{button.disabled=false}
  }
  async function boot(){
    q("[data-admin-mode]").hidden=!S.demoMode;
    if(S.demoMode)showDashboard(null);else{try{const authorized=await S.isAdmin();if(authorized){const session=await S.getSession();showDashboard(session?.user)}else showLogin()}catch(_){showLogin()}}
    q("[data-login-form]").addEventListener("submit",async e=>{e.preventDefault();const f=e.currentTarget,status=q("[data-login-status]"),button=f.querySelector("button[type=submit]");button.disabled=true;status.textContent="Signing in…";try{const user=await S.signIn(f.elements.email.value,f.elements.password.value);status.textContent="";showDashboard(user)}catch(error){status.textContent=error.message;status.classList.add("status-error")}finally{button.disabled=false}});
    q("[data-sign-out]").addEventListener("click",async()=>{await S.signOut();showLogin()});
    q("[data-new-product]").addEventListener("click",()=>editProduct(null));q("[data-cancel-editor]").addEventListener("click",cancelEditor);form.addEventListener("submit",save);q("[data-refresh-products]").addEventListener("click",refreshList);
    form.elements.namedItem("image_url").addEventListener("input",e=>{const img=q("[data-image-preview]"),empty=q("[data-image-empty]");img.src=e.target.value;img.hidden=!e.target.value;empty.hidden=!!e.target.value});
    form.elements.namedItem("image_file").addEventListener("change",e=>{const file=e.target.files[0];if(file&&S.demoMode){setStatus("[data-product-status]","Image upload needs the online store. Use an image URL in this local demo.",true);e.target.value=""}});
    document.addEventListener("click",async e=>{const edit=e.target.closest("[data-edit-product]"),toggle=e.target.closest("[data-toggle-product]"),remove=e.target.closest("[data-delete-product]");try{if(edit)editProduct(items.find(p=>p.id===edit.dataset.editProduct));if(toggle){const p=items.find(item=>item.id===toggle.dataset.toggleProduct);if(p){await S.saveProduct({...p,is_active:!p.is_active});await refreshList()}}if(remove){const p=items.find(item=>item.id===remove.dataset.deleteProduct);if(p&&confirm("Remove "+p.name+" from the catalogue? This also removes it from the live shop.")){await S.deleteProduct(p);await refreshList()}}}catch(error){alert(error.message)}});
  }
  document.addEventListener("DOMContentLoaded",boot);
})();
