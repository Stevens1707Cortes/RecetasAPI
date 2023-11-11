
function inicarApp() {

    // Variables
    const categoriasSelect = document.querySelector('#categorias');
    const resultados = document.querySelector('#resultado');
    const modal = new bootstrap.Modal('#modal', {});
    const favoritosDiv = document.querySelector('.favoritos');

    // Event listeners

    if (favoritosDiv) {
        obtenerFavoritos();
    }

    if (categoriasSelect) {
        categoriasSelect.addEventListener('change', seleccionarCategoria);

        ObtenerCategorias();
    }
    
    // Funciones

    function ObtenerCategorias() {
        const url = 'https://www.themealdb.com/api/json/v1/1/categories.php';
        fetch(url)
            .then( resultado => resultado.json())
            .then( datos => {
                categoriasOptions(datos);
            })
    }

    function categoriasOptions({categories}) {

        categories.forEach(categoria => {
            const {strCategory} = categoria;
            const option = document.createElement('option');
            option.value = strCategory;
            option.textContent = strCategory;

            categoriasSelect.appendChild(option);
        });
        
    }

    function seleccionarCategoria(e) {
        const categoria = e.target.value;

        if (categoria !== '-- Seleccione --') {
            const url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${categoria}`;

            fetch(url)
                .then( resultado => resultado.json())
                .then( datos => {
                    mostrarRecetas(datos.meals);
                })
        }
    }

    function mostrarRecetas(recetas) {

        limpiarHTML(resultados);

        const heading = document.createElement('h2');
        heading.classList.add('text-center', 'text-black', 'my-5');
        heading.textContent = recetas.length ? 'Resultados': 'No hay resultados';
        resultados.appendChild(heading);

        // Iterar en los resultados
        recetas.forEach(receta => {
            const {strMeal, strMealThumb, idMeal} = receta;

            const recetaContenedor = document.createElement('div');
            recetaContenedor.classList.add('col-md-4', 'contenedor');

            recetaContenedor.setAttribute('id', idMeal ?? receta.id);


            const recetaCard = document.createElement('div');
            recetaCard.classList.add('card', 'mb-4');

            const recetaImagen = document.createElement('img');
            recetaImagen.classList.add('card-img-top');
            recetaImagen.src = strMealThumb ?? receta.img;
            recetaImagen.alt = `Imagen de la receta: ${strMeal ?? receta.titulo}`;

            const recetaCardBody = document.createElement('div');
            recetaCardBody.classList.add('card-body');

            const recetaHeading = document.createElement('h3');
            recetaHeading.classList.add('card-title', 'mb-3');
            recetaHeading.textContent = strMeal ?? receta.titulo;

            const recetaButton = document.createElement('button');
            recetaButton.classList.add('btn', 'btn-danger', 'w-100');
            recetaButton.textContent = 'Ver Receta';
            // recetaButton.dataset.bsTarget = '#modal';
            // recetaButton.dataset.bsToogle = 'modal';
            recetaButton.onclick = function() {
                seleccionarReceta(idMeal ?? receta.id);
            }

            // Inyectar codigo HTML
            
            recetaCardBody.appendChild(recetaHeading);
            recetaCardBody.appendChild(recetaButton);
            recetaCard.appendChild(recetaImagen);
            recetaCard.appendChild(recetaCardBody);
            recetaContenedor.appendChild(recetaCard);
            resultados.appendChild(recetaContenedor);

        });
        
    }   

    function seleccionarReceta(id) {
        const url = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`;

        fetch(url)
            .then( resultado => resultado.json())
            .then( datos => {
                mostrarRecetaModal(datos.meals[0]);
            })
    }

    function mostrarRecetaModal(receta) {

        const {idMeal, strInstructions, strMeal, strMealThumb} = receta;
        // Añadir contenido al modal
        const modalTitle = document.querySelector('.modal-title');
        const modalBody = document.querySelector('.modal-body');
        const modalFoot = document.querySelector('.modal-footer');


        modalTitle.textContent = strMeal;
        modalBody.innerHTML = `
            <img class="img-fluid" src="${strMealThumb}" alt="receta ${strMeal}"/>
            <h3 class="my-3">Instrucciones</h3>
            <p>${strInstructions}</p>
            <h3 class="my-3">Ingredientes y Cantidades</h3>
        `;

        // Mostrar cantidades e ingredientes
        const listGroup = document.createElement('ul');
        listGroup.classList.add('list-group');

        for (let i = 1; i <= 20; i++) {
            
            if (receta[`strIngredient${i}`]) {
                const ingrediente = receta[`strIngredient${i}`];
                const cantidad = receta[`strMeasure${i}`];

                const ingredientesLista = document.createElement('li');
                ingredientesLista.classList.add('list-group-item');
                ingredientesLista.textContent = `${ingrediente} - ${cantidad}`;

                listGroup.appendChild(ingredientesLista);
            }
        }

        modalBody.appendChild(listGroup);

        // Botones de Favorito y Cerrar
        limpiarHTML(modalFoot);

        const btnFavorito = document.createElement('button');
        btnFavorito.classList.add('btn', 'btn-danger', 'col');
        btnFavorito.textContent = existeStorage(idMeal) ? 'Eliminar Favorito' : 'Guardar Favorito';

        btnFavorito.setAttribute('data-id', idMeal);

        // Almacenar en LocalStorage
        btnFavorito.onclick = function() {
            const recetaId = this.getAttribute('data-id');

        if (existeStorage(idMeal)) {

            eliminarFavorito(idMeal, recetaId);
            btnFavorito.textContent = 'Guardar Favorito';
            mostrarToast('Eliminado Correctamente');

            return;
        }

            agregarFavorito({
                id: idMeal,
                titulo: strMeal,
                img: strMealThumb
            });
            btnFavorito.textContent = 'Eliminar Favorito';
            mostrarToast('Agregado a Favoritos');
        }

        const btnCerrar = document.createElement('button');
        btnCerrar.classList.add('btn', 'btn-secondary', 'col');
        btnCerrar.textContent = 'Cerrar';
        btnCerrar.onclick = function() {
            modal.hide();
        }

        modalFoot.appendChild(btnFavorito);
        modalFoot.appendChild(btnCerrar);

        // Muestra modal
        modal.show();


    }

    function agregarFavorito(receta) {
        //Obtener de localstorage
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        localStorage.setItem('favoritos', JSON.stringify([...favoritos, receta]));

    }

    function eliminarFavorito(id, dataId) {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        const nuevosFavoritos = favoritos.filter(favorito => favorito.id !== id);
        localStorage.setItem('favoritos', JSON.stringify(nuevosFavoritos));

        if (favoritosDiv) {
            const favoritoElim = favoritosDiv.querySelectorAll('.contenedor');
            favoritoElim.forEach(favorito => {
                 if (favorito.id === dataId) {
                    favorito.remove();
                }
            });
        }
    }

    function existeStorage(id) {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];

        return favoritos.some(favorito => favorito.id === id);
    }

    function mostrarToast(mensaje) {
        const toastDiv = document.querySelector('#toast');
        const toastBody = document.querySelector('.toast-body');
        const toast = new bootstrap.Toast(toastDiv);
        toastBody.textContent = mensaje;
        toast.show();
    }

    function obtenerFavoritos() {

        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        if (favoritos.length) {
            mostrarRecetas(favoritos);
            return;
        }

        const noFavoritos = document.createElement('p');
        noFavoritos.classList.add('fs-4','text-center','font-bold', 'mt-5');
        noFavoritos.textContent = 'No hay favoritos aun';

        favoritosDiv.appendChild(noFavoritos);
    }

    function limpiarHTML(referencia) {
        while (referencia.firstChild) {
            referencia.removeChild(referencia.firstChild);
        }
    }

}

document.addEventListener('DOMContentLoaded', inicarApp);
